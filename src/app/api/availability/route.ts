import { NextRequest, NextResponse } from "next/server";
import { getDaySlots, getOpenDates, serviceDuration } from "@/lib/availability";

/**
 * Public: which times are free.
 *
 * Reachable without a session because the booking form on the website needs it.
 * It only ever exposes free start times — never who booked the rest, or any
 * client detail.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const service = searchParams.get("service") ?? "";
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const duration = await serviceDuration(service);

    if (date) {
      const day = await getDaySlots(date, duration);
      return NextResponse.json({ ...day, durationMinutes: duration });
    }

    if (from && to) {
      const dates = await getOpenDates(from, to, duration);
      return NextResponse.json({ dates, durationMinutes: duration });
    }

    return NextResponse.json({ error: "date or from/to required" }, { status: 400 });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
