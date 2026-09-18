import { NOTE_STATUS_LABELS, NOTE_STATUS_COLORS } from "@/lib/notes";

/**
 * El estado se guarda en inglés en la base, igual que el de las citas, y aquí
 * se muestra en español. El color va inline porque es un valor calculado.
 */
export function NoteStatusBadge({ status }: { status: string }) {
  const color = NOTE_STATUS_COLORS[status] ?? "#6B7280";
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {NOTE_STATUS_LABELS[status] ?? status}
    </span>
  );
}
