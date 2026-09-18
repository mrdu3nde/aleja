import { NextResponse } from "next/server";
import { runTranscription } from "@/lib/notes-server";

// Mismo margen que al crear: el modelo tarda varios segundos.
export const maxDuration = 60;

/**
 * Reintento de lectura. Existe para cuando faltaba la API key o se agotó la
 * cuota: se arregla el entorno y ella vuelve a intentar sin repetir la foto.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const note = await runTranscription(id);
    if (!note) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: note });
  } catch (error) {
    console.error("Note retranscribe error:", error);
    return NextResponse.json({ error: "Failed to transcribe" }, { status: 500 });
  }
}
