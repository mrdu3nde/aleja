import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { decodeDataUrl, transcribeVoiceNote } from "@/lib/notes-ai";

// Igual que al crear una nota: transcribir tarda unos segundos.
export const maxDuration = 60;

const messageSchema = z
  .object({
    audio: z.string().startsWith("data:audio/").max(12_000_000).optional(),
    text: z.string().trim().min(1).max(20_000).optional(),
  })
  .refine((v) => Boolean(v.audio || v.text), {
    message: "Hace falta la grabación o el texto",
  });

/**
 * Su respuesta cuando dejé una pregunta en la nota.
 *
 * Puede contestar hablando, igual que dicta la nota original. Al responder, la
 * nota vuelve a estado "leída": ya no le falta información, y así aparece otra
 * vez en `npm run notes` como algo que puedo retomar.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: z.infer<typeof messageSchema>;
  try {
    body = messageSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const note = await prisma.note.findUnique({ where: { id }, select: { id: true } });
  if (!note) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let text = body.text?.trim() ?? "";

  if (body.audio) {
    try {
      const { bytes, mediaType } = decodeDataUrl(body.audio);
      const result = await transcribeVoiceNote(bytes, mediaType);
      if (!result.transcripcion.trim()) {
        return NextResponse.json({ error: "sin_voz" }, { status: 422 });
      }
      text = result.transcripcion.trim();
    } catch (error) {
      const reason = (error as Error).message || "unknown";
      console.error("Message transcription error:", reason);
      return NextResponse.json(
        { error: reason === "no_api_key" ? "sin_configurar" : "transcripcion_fallo" },
        { status: 503 },
      );
    }
  }

  try {
    const [message] = await prisma.$transaction([
      prisma.noteMessage.create({ data: { noteId: id, author: "owner", body: text } }),
      // Contestó, así que ya no le falta información. Si estaba resuelta no se
      // toca: una aclaración tardía no reabre algo ya hecho.
      prisma.note.updateMany({
        where: { id, status: "needs_info" },
        data: { status: "read" },
      }),
    ]);
    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    console.error("Message create error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
