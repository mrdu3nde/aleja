import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { noteListSelect } from "@/lib/notes-server";
import { NOTE_STATUSES } from "@/lib/notes";
import { decodeDataUrl, transcribeVoiceNote } from "@/lib/notes-ai";

// Transcribir tarda unos segundos; el default de Next se queda corto.
export const maxDuration = 60;

const noteSchema = z
  .object({
    /// WAV mono 16 kHz que arma el navegador. El tope son ~4 minutos de voz.
    audio: z.string().startsWith("data:audio/").max(12_000_000).optional(),
    /// Salida de escape: dictar no siempre se puede (un lugar ruidoso, la
    /// vergüenza de hablarle al teléfono). Entonces lo escribe.
    text: z.string().trim().min(1).max(20_000).optional(),
    /// Foto de respaldo, opcional y sin transcribir.
    imageUrl: z.string().url().optional(),
    imageData: z.string().startsWith("data:image/").max(1_500_000).optional(),
  })
  .refine((v) => Boolean(v.audio || v.text), {
    message: "Hace falta la grabación o el texto",
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
  let body: z.infer<typeof noteSchema>;
  try {
    body = noteSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let transcript = body.text?.trim() ?? "";
  let title: string | null = null;
  let model: string | null = null;

  if (body.audio) {
    // Se transcribe ANTES de crear la nota, a propósito. El audio no se
    // guarda, así que una nota creada con la transcripción fallida sería una
    // nota vacía y sin forma de recuperarla. Fallando aquí, el navegador
    // todavía tiene la grabación y ella puede reintentar o escribirla.
    try {
      const { bytes, mediaType } = decodeDataUrl(body.audio);
      const result = await transcribeVoiceNote(bytes, mediaType);

      if (!result.transcripcion.trim()) {
        return NextResponse.json({ error: "sin_voz" }, { status: 422 });
      }

      transcript = result.transcripcion.trim();
      title = result.titulo || null;
      model = result.model;
    } catch (error) {
      const reason = (error as Error).message || "unknown";
      console.error("Note transcription error:", reason);
      return NextResponse.json(
        { error: reason === "no_api_key" ? "sin_configurar" : "transcripcion_fallo" },
        { status: 503 },
      );
    }
  }

  try {
    const note = await prisma.note.create({
      data: {
        transcript,
        title,
        source: body.audio ? "voice" : "text",
        aiStatus: "ok",
        aiModel: model,
        imageUrl: body.imageUrl ?? null,
        imageData: body.imageData ?? null,
      },
      select: noteListSelect,
    });
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    console.error("Note create error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
