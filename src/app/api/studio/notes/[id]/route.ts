import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { noteListSelect } from "@/lib/notes-server";
import { NOTE_STATUSES } from "@/lib/notes";

const patchSchema = z.object({
  /// Su corrección cuando el modelo leyó mal. `transcript` no se toca nunca.
  editedText: z.string().max(20000).optional(),
  title: z.string().max(200).nullable().optional(),
  status: z.enum(NOTE_STATUSES).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // El detalle sí incluye la foto: es la única pantalla que la muestra.
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: note });
  } catch (error) {
    console.error("Note fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = patchSchema.parse(await request.json());
    const note = await prisma.note.update({
      where: { id },
      data,
      select: noteListSelect,
    });
    return NextResponse.json({ data: note });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    console.error("Note update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Note delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
