import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { noteListSelect, runTranscription } from "@/lib/notes-server";
import { NOTE_STATUSES } from "@/lib/notes";

// Transcribir una foto tarda varios segundos; el default de Next se queda corto.
export const maxDuration = 60;

const noteSchema = z
  .object({
    /// URL que devuelve Vercel Blob cuando está configurado.
    imageUrl: z.string().url().optional(),
    /// Respaldo sin Blob: la foto ya reducida en el navegador. El tope evita
    /// que una foto sin comprimir reviente la fila y el body de la función.
    imageData: z
      .string()
      .startsWith("data:image/")
      .max(1_500_000)
      .optional(),
  })
  .refine((v) => Boolean(v.imageUrl || v.imageData), {
    message: "Falta la foto",
  });

export async function GET(request: Request) {
  try {
    const status = new URL(request.url).searchParams.get("status");
    const data = await prisma.note.findMany({
      where: status && NOTE_STATUSES.includes(status as never) ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: noteListSelect,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Notes list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = noteSchema.parse(await request.json());

    // La foto se guarda primero y se transcribe después, en ese orden: si el
    // modelo falla o no hay cuota, la nota de ella no se pierde igual.
    const created = await prisma.note.create({
      data: { imageUrl: body.imageUrl ?? null, imageData: body.imageData ?? null },
      select: { id: true },
    });

    const note = await runTranscription(created.id);
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    console.error("Note create error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
