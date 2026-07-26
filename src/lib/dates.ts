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

/** "Sun, Jul 26" */
export function formatDay(iso: string): string {
  return parseDay(iso).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** "Sunday, July 26" */
export function formatDayLong(iso: string): string {
  return parseDay(iso).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Heading for a day group: "Today", "Tomorrow", or the long date. */
export function dayHeading(iso: string): string {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDayLong(iso);
}

/** Compact relative label for a row: "Today", "in 3 days", "2 days ago". */
export function relativeDay(iso: string): string | null {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 7) return `in ${diff} days`;
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return null;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};
