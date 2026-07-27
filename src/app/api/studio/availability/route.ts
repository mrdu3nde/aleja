import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(1440),
  endMinutes: z.number().int().min(0).max(1440),
  active: z.boolean(),
});

const bodySchema = z.object({
  days: z.array(daySchema).max(7),
  blocked: z
    .array(z.object({ date: z.string().min(8), reason: z.string().max(80).optional() }))
    .optional(),
});

export async function GET() {
  try {
    const [days, blocked] = await Promise.all([
      prisma.availability.findMany({ orderBy: { dayOfWeek: "asc" } }),
      prisma.blockedDate.findMany({ orderBy: { date: "asc" } }),
    ]);
    return NextResponse.json({ days, blocked });
  } catch (error) {
    console.error("Availability GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = bodySchema.parse(await request.json());

    await prisma.$transaction(
      data.days
        // an end before the start would silently swallow the whole day
        .filter((d) => !d.active || d.endMinutes > d.startMinutes)
        .map((d) =>
          prisma.availability.upsert({
            where: { dayOfWeek: d.dayOfWeek },
            update: {
              startMinutes: d.startMinutes,
              endMinutes: d.endMinutes,
              active: d.active,
            },
            create: d,
          }),
        ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Availability PUT error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
