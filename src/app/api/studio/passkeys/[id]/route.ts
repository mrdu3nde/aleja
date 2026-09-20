import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Quitar un dispositivo: el teléfono perdido deja de servir de inmediato. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.credential.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("passkey delete", error);
    return NextResponse.json({ error: "No se pudo quitar el dispositivo" }, { status: 500 });
  }
}
