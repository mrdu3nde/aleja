/**
 * Pure time helpers, safe to import from client components.
 *
 * Kept apart from `availability.ts` on purpose: that module talks to Prisma,
 * and anything a "use client" file imports gets bundled for the browser — which
 * fails outright when Prisma comes along for the ride.
 */

/** Candidate start times are offered every half hour. */
export const SLOT_STEP_MINUTES = 30;

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

export const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const formatTime12 = (hhmm: string): string => {
  const m = toMinutes(hhmm);
  const h = Math.floor(m / 60);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m % 60).padStart(2, "0")} ${period}`;
};

/** "90" -> "1h 30min" */
export const humanDuration = (mins: number): string =>
  mins < 60
    ? `${mins} min`
    : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}min` : ""}`;

export type OpeningHours = {
  /** Weekday (0=Sun) -> minutes open, or null when closed that day. */
  days: Record<number, { startMinutes: number; endMinutes: number } | null>;
  /** "YYYY-MM-DD" -> reason. Overrides the weekly hours. */
  blocked: Record<string, string>;
};

export type DayOpening =
  | { open: true; startMinutes: number; endMinutes: number }
  | { open: false; reason: string };

/** Whether the studio works on a given date, and why not when it does not. */
export function openingFor(iso: string, hours: OpeningHours | null): DayOpening {
  if (!hours) return { open: true, startMinutes: 0, endMinutes: 1440 };

  const blockedReason = hours.blocked[iso];
  if (blockedReason !== undefined) {
    return { open: false, reason: blockedReason || "Closed" };
  }

  const [y, m, d] = iso.split("-").map(Number);
  const window = hours.days[new Date(y, m - 1, d).getDay()];
  if (!window) return { open: false, reason: "Closed" };

  return { open: true, startMinutes: window.startMinutes, endMinutes: window.endMinutes };
}
