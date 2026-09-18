import { prisma } from "./prisma";
import { transcribeNote, decodeDataUrl } from "./notes-ocr";

/**
 * Lo que se manda al panel. `imageData` se excluye a propósito: son cientos de
 * KB por fila y el listado se volvería pesadísimo en el celular.
 */
export const noteListSelect = {
  id: true,
  imageUrl: true,
  title: true,
  transcript: true,
  editedText: true,
  status: true,
  ocrStatus: true,
  ocrError: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Transcribe la foto de una nota y guarda el resultado.
 *
 * Nunca lanza: si el modelo falla, la nota queda con `ocrStatus: "failed"` y
 * su motivo. La foto ya está guardada, así que ella siempre puede escribir el
 * texto a mano en vez de perder la nota.
 */
export async function runTranscription(noteId: string) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) return null;

  try {
    // La foto siempre sale del navegador reducida a JPEG, así que el tipo es
    // conocido; cuando hay Blob, el modelo la descarga de la URL.
    const result = note.imageUrl
      ? await transcribeNote(new URL(note.imageUrl), "image/jpeg")
      : await (async () => {
          const { bytes, mediaType } = decodeDataUrl(note.imageData ?? "");
          return transcribeNote(bytes, mediaType);
        })();

    return await prisma.note.update({
      where: { id: noteId },
      data: {
        transcript: result.transcripcion,
        title: result.titulo || null,
        ocrStatus: "ok",
        ocrError: null,
        ocrModel: result.model,
      },
      select: noteListSelect,
    });
  } catch (error) {
    const reason = (error as Error).message || "unknown";
    console.error("Note transcription error:", reason);
    return prisma.note.update({
      where: { id: noteId },
      data: { ocrStatus: "failed", ocrError: reason.slice(0, 300) },
      select: noteListSelect,
    });
  }
}
