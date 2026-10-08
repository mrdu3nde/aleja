import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceRecordSchema } from "@/lib/admin-validators";

/** Anota un servicio hecho a esta clienta. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = serviceRecordSchema.parse(await request.json());
    const record = await prisma.serviceRecord.create({
      data: {
        clientId: id,
        // Mediodía UTC: así la fecha no cambia de día por zona horaria.
        date: new Date(`${data.date}T12:00:00Z`),
        service: data.service || null,
        formula: data.formula || null,
        cut: data.cut || null,
        mapping: data.mapping || null,
        notes: data.notes || null,
        beforeUrl: data.beforeUrl || null,
        afterUrl: data.afterUrl || null,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Create record error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 400 });
  }
}
