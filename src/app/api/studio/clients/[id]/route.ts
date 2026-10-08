import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientUpdateSchema } from "@/lib/admin-validators";
import { normalizePhone } from "@/lib/phone";
import { deleteImage } from "@/lib/delete-image";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUniqueOrThrow({
      where: { id },
      include: {
        appointments: {
          orderBy: { createdAt: "desc" },
          include: { payments: true },
        },
        records: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Get client error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = clientUpdateSchema.parse(body);

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        // keep the match key in sync whenever the phone changes
        ...(data.phone !== undefined && {
          phone: data.phone,
          phoneNormalized: normalizePhone(data.phone),
        }),
        ...(data.contactPreference !== undefined && {
          contactPreference: data.contactPreference,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.priorHistory !== undefined && { priorHistory: data.priorHistory }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // Las fichas se borran en cascada con la clienta; sus fotos hay que
    // quitarlas a mano o quedarían ocupando espacio en Blob.
    const records = await prisma.serviceRecord.findMany({ where: { clientId: id } });
    await prisma.client.delete({ where: { id } });
    for (const r of records) {
      void deleteImage(r.beforeUrl);
      void deleteImage(r.afterUrl);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
