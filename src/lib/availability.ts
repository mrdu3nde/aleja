import { prisma } from "./prisma";
import { SLOT_STEP_MINUTES, toMinutes, toHHMM } from "./time";

export type DaySlots = {
  date: string;
  /** Closed because the weekday is off, or because the date is blocked. */
  closed: boolean;
  reason: string | null;
  /** Start times that fit the whole service without overlapping a booking. */
  slots: string[];
};

/**
 * Free start times on a date for a service of a given length.
 *
 * A slot is offered only when the *entire* service fits inside opening hours
 * and overlaps nothing already booked — a two-hour service is not offered at
 * 17:00 when the day ends at 18:00, and booking it at 10:00 also removes 10:30
 * and 11:00 from the list.
 *
 * Cancelled appointments free their time back up. Appointments with no time are
 * ignored: they occupy no particular slot.
 */
export async function getDaySlots(
  date: string,
  durationMinutes: number,
): Promise<DaySlots> {
  const duration = Math.max(15, Math.round(durationMinutes || 60));
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  const [hours, blocked, booked] = await Promise.all([
    prisma.availability.findUnique({ where: { dayOfWeek } }),
    prisma.blockedDate.findUnique({ where: { date } }),
    prisma.appointment.findMany({
      where: {
        preferredDate: date,
        preferredTime: { not: null },
        status: { not: "cancelled" },
      },
      select: { preferredTime: true, durationMinutes: true },
    }),
  ]);

  if (blocked) {
    return { date, closed: true, reason: blocked.reason ?? "Closed", slots: [] };
  }
  if (!hours || !hours.active || hours.endMinutes <= hours.startMinutes) {
    return { date, closed: true, reason: "Closed this day", slots: [] };
  }

  const taken = booked.map((b) => {
    const start = toMinutes(b.preferredTime!);
    return { start, end: start + (b.durationMinutes ?? 60) };
  });

  const slots: string[] = [];
  for (
    let start = hours.startMinutes;
    start + duration <= hours.endMinutes;
    start += SLOT_STEP_MINUTES
  ) {
    const end = start + duration;
    const clashes = taken.some((t) => start < t.end && end > t.start);
    if (!clashes) slots.push(toHHMM(start));
  }

  return { date, closed: false, reason: null, slots };
}

/** How long a service takes, by name or slug. Falls back to an hour. */
export async function serviceDuration(serviceRef: string): Promise<number> {
  if (!serviceRef) return 60;
  try {
    const match = await prisma.service.findFirst({
      where: {
        OR: [
          { name: { equals: serviceRef, mode: "insensitive" } },
          { slug: { equals: serviceRef, mode: "insensitive" } },
        ],
      },
      select: { durationMinutes: true },
    });
    return match?.durationMinutes ?? 60;
  } catch {
    return 60;
  }
}

/** Which dates in a range have at least one free slot — drives the date picker. */
export async function getOpenDates(
  from: string,
  to: string,
  durationMinutes: number,
): Promise<string[]> {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const cursor = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);

  const dates: string[] = [];
  while (cursor <= end && dates.length < 120) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    dates.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }

  const results = await Promise.all(dates.map((d) => getDaySlots(d, durationMinutes)));
  return results.filter((r) => !r.closed && r.slots.length > 0).map((r) => r.date);
}
