import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const serviceSchema = z.object({
  name: z.string().min(2).max(80),
  price: z.number().min(0).max(100000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
  active: z.boolean().optional(),
});

/** URL-safe, stable key derived from the name. */
function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function GET() {
  try {
    const data = await prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Services list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = serviceSchema.parse(await request.json());

    // Slugs are permanent keys for the translated copy, so a collision gets a
    // suffix rather than overwriting an existing service's content.
    const base = slugify(data.name) || "service";
    let slug = base;
    for (let i = 2; await prisma.service.findUnique({ where: { slug } }); i++) {
      slug = `${base}-${i}`;
    }

    const last = await prisma.service.findFirst({ orderBy: { sortOrder: "desc" } });

    const service = await prisma.service.create({
      data: {
        slug,
        name: data.name,
        price: data.price ?? null,
        imageUrl: data.imageUrl ?? null,
        icon: data.icon ?? null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
