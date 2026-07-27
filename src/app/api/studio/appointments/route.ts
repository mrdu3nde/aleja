import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/admin-validators";
import { resolveDeposit } from "@/lib/deposit";
import { resolveService } from "@/lib/services";
import { serviceDuration } from "@/lib/availability";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const scope = searchParams.get("scope"); // upcoming | past | all
    const deposit = searchParams.get("deposit"); // "pending"
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (deposit === "pending") {
      where.depositRequired = true;
      where.depositStatus = { not: "received" };
      // nobody owes a deposit on a booking that was called off
      where.status = { not: "cancelled" };
    }
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calendar mode: every appointment in a date range, unpaginated.
    // preferredDate is a "YYYY-MM-DD" string, so lexicographic compare == date compare.
    // Undated appointments are included on purpose — the calendar surfaces them in a
    // separate block, and a range filter alone would silently drop them.
    if (from && to) {
      const rangeOr = [
        { preferredDate: { gte: from, lte: to } },
        { preferredDate: null },
      ];
      const data = await prisma.appointment.findMany({
        where: where.OR
          ? { AND: [where, { OR: rangeOr }] }
          : { ...where, OR: rangeOr },
        orderBy: { preferredDate: "asc" },
      });
      return NextResponse.json({ data, total: data.length, page: 1, totalPages: 1 });
    }

    // List mode: read like an agenda — soonest first, undated last.
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // "Upcoming" means work still ahead of her, so a cancelled booking has no
    // business being there — it is not going to happen. It stays reachable
    // through its own filter and through "All".
    const scopeFilter =
      scope === "past"
        ? { preferredDate: { lt: todayIso } }
        : scope === "all"
          ? null
          : {
              AND: [
                { OR: [{ preferredDate: { gte: todayIso } }, { preferredDate: null }] },
                { status: { not: "cancelled" } },
              ],
            };

    const finalWhere = scopeFilter ? { AND: [where, scopeFilter] } : where;

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where: finalWhere,
        orderBy:
          scope === "past"
            ? [{ preferredDate: "desc" }, { createdAt: "desc" }]
            : [{ preferredDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where: finalWhere }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Appointments list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = appointmentSchema.parse(body);
    const resolved = await resolveService(data.service);
    const duration = await serviceDuration(data.service);

    const appointment = await prisma.appointment.create({
      data: {
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone || null,
        service: resolved?.name ?? data.service,
        preferredDate: data.preferredDate || null,
        preferredTime: data.preferredTime || null,
        // snapshot: later edits to the service never rewrite this booking
        durationMinutes: duration,
        message: data.message || null,
        status: data.status || "pending",
        source: "admin",
        // an explicit price wins; otherwise fall back to the service's fixed one
        servicePrice: data.servicePrice ?? resolved?.price ?? null,
        // chosen per booking so the deposit can match the service
        ...resolveDeposit(data.depositRequired, data.depositAmount),
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
