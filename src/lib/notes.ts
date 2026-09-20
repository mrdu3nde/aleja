/// Estados de una nota. Se guardan en inglés en la base, igual que las citas,
/// y se muestran en español en el panel.
///
/// `needs_info` no lo pone ella: lo pongo yo desde código cuando la nota no
/// alcanza para implementar lo que pide, junto con la pregunta concreta.
export const NOTE_STATUSES = ["new", "read", "needs_info", "done"] as const;

export type NoteStatus = (typeof NOTE_STATUSES)[number];

export const NOTE_STATUS_LABELS: Record<string, string> = {
  new: "Nueva",
  read: "Leída",
  needs_info: "Falta info",
  done: "Resuelta",
};

export const NOTE_STATUS_COLORS: Record<string, string> = {
  new: "#F59E0B",
  read: "#2563EB",
  needs_info: "#DC2626",
  done: "#10B981",
};

/**
 * El texto que vale de una nota: su corrección a mano si la escribió, y si no
 * lo que oyó el modelo. Un `editedText` en blanco cuenta como no corregido.
 */
export function noteText(note: { transcript?: string | null; editedText?: string | null }) {
  const edited = note.editedText?.trim();
  return edited && edited.length > 0 ? edited : (note.transcript ?? "");
}

/** Quién escribió cada mensaje de la conversación de una nota. */
export const MESSAGE_AUTHORS = ["claude", "owner"] as const;

export const MESSAGE_AUTHOR_LABELS: Record<string, string> = {
  claude: "Desarrollo",
  owner: "Tú",
};
