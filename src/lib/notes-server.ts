import { prisma } from "./prisma";

/**
 * Lo que se manda al listado. `imageData` se excluye a propósito: son cientos
 * de KB por fila y el listado se volvería pesadísimo en el celular.
 */
export const noteListSelect = {
  id: true,
  title: true,
  transcript: true,
  editedText: true,
  source: true,
  status: true,
  aiStatus: true,
  aiError: true,
  imageUrl: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** El detalle sí trae la conversación y la foto. */
export const noteDetailInclude = {
  messages: { orderBy: { createdAt: "asc" } },
} as const;

/**
 * Marca como leída una nota nueva al abrirla.
 *
 * Solo toca las que están en "new": si ya la resolví o le pedí más datos, que
 * ella la abra no debe hacerla retroceder de estado.
 */
export async function markRead(noteId: string) {
  await prisma.note.updateMany({
    where: { id: noteId, status: "new" },
    data: { status: "read" },
  });
}
