import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceRecordSchema } from "@/lib/admin-validators";
import { deleteImage } from "@/lib/delete-image";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = serviceRecordSchema.parse(await request.json());
    const current = await prisma.serviceRecord.findUniqueOrThrow({ where: { id } });

    const record = await prisma.serviceRecord.update({
      where: { id },
      data: {
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

    // Una foto reemplazada o quitada no debe quedar huérfana.
    if (current.beforeUrl && current.beforeUrl !== record.beforeUrl) void deleteImage(current.beforeUrl);
    if (current.afterUrl && current.afterUrl !== record.afterUrl) void deleteImage(current.afterUrl);

    return NextResponse.json(record);
  } catch (error) {
    console.error("Update record error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const record = await prisma.serviceRecord.delete({ where: { id } });
    void deleteImage(record.beforeUrl);
    void deleteImage(record.afterUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete record error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
