import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { noteDetailInclude, noteListSelect, markRead } from "@/lib/notes-server";
import { NOTE_STATUSES } from "@/lib/notes";

const patchSchema = z.object({
  /// Su corrección cuando el modelo oyó mal. `transcript` no se toca nunca.
  editedText: z.string().max(20_000).optional(),
  title: z.string().max(200).nullable().optional(),
  status: z.enum(NOTE_STATUSES).optional(),
  /// Adjuntar o quitar la foto de respaldo después de haber creado la nota.
  imageData: z.string().startsWith("data:image/").max(1_500_000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Se marca como leída ANTES de leerla, no después: al revés, la respuesta
    // llevaría el estado viejo y la pantalla mostraría "Nueva" hasta que ella
    // recargara. `markRead` solo toca las que están en "new", así que una nota
    // ya resuelta o esperando datos no retrocede.
    await markRead(id);

    // El detalle sí incluye la foto y la conversación: es la única pantalla
    // donde se ven.
    const note = await prisma.note.findUnique({ where: { id }, include: noteDetailInclude });
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
      data: {
        ...data,
        // Resolverla desde el panel también deja la fecha, igual que cuando la
        // resuelvo desde código.
        ...(data.status === "done" ? { resolvedAt: new Date() } : {}),
        ...(data.status && data.status !== "done" ? { resolvedAt: null } : {}),
      },
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
