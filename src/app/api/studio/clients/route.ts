import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/admin-validators";
import { normalizePhone } from "@/lib/phone";

/** Shape the modal and the clients table both rely on: counts + last visit. */
const listInclude = {
  _count: { select: { appointments: true } },
  appointments: {
    orderBy: { preferredDate: "desc" as const },
    take: 1,
    select: { preferredDate: true, service: true },
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    // A search term can be a name, an email, or a phone in any format.
    const digits = normalizePhone(search);
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            ...(digits ? [{ phoneNormalized: { contains: digits } }] : []),
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: listInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Clients list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = clientSchema.parse(body);

    // email is @unique — surface the clash so the caller can offer to link
    // to the existing client instead of dying with a 500.
    const email = data.email || null;
    const existing = email
      ? await prisma.client.findUnique({ where: { email } })
      : null;
    if (existing) {
      return NextResponse.json(
        { error: "duplicate_email", client: existing },
        { status: 409 },
      );
    }

    const client = await prisma.client.create({
      data: {
        name: data.name,
        email,
        phone: data.phone || null,
        phoneNormalized: normalizePhone(data.phone),
        contactPreference: data.contactPreference || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
