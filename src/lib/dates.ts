/**
 * preferredDate is stored as a plain "YYYY-MM-DD" string. Never feed it to
 * `new Date(str)` directly — that parses as UTC midnight and shifts the day
 * backwards for anyone west of Greenwich. Always build a local date instead.
 */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "YYYY-MM-DD" for a local date, without the toISOString() timezone shift. */
export function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayIso(): string {
  return isoDay(new Date());
}

/** Whole days from today. Negative = past. */
export function daysFromToday(iso: string): number {
  const today = parseDay(todayIso());
  const target = parseDay(iso);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** "dom, 26 jul" */
export function formatDay(iso: string): string {
  return parseDay(iso).toLocaleDateString("es-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "domingo, 26 de julio" */
export function formatDayLong(iso: string): string {
  return parseDay(iso).toLocaleDateString("es-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Heading for a day group: "Hoy", "Mañana", or the long date. */
export function dayHeading(iso: string): string {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  return formatDayLong(iso);
}

/** Compact relative label for a row: "Hoy", "en 3 días", "hace 2 días". */
export function relativeDay(iso: string): string | null {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff <= 7) return `en ${diff} días`;
  if (diff < -1 && diff >= -7) return `hace ${Math.abs(diff)} días`;
  return null;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};
