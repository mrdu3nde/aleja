import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

/**
 * Clients that plausibly are the person who booked this appointment.
 *
 * Two signals, deliberately ranked:
 *  - email  → exact, and email is @unique, so it identifies one person
 *  - phone  → normalized, but a phone can be shared (a mother booking for her
 *             daughter, a household line), so it only ever *suggests*
 *
 * Nothing here links anything. The owner confirms every match by hand.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const apt = await prisma.appointment.findUniqueOrThrow({ where: { id } });

    const phoneKey = normalizePhone(apt.clientPhone);
    const conditions = [];
    if (apt.clientEmail) conditions.push({ email: apt.clientEmail });
    if (phoneKey) conditions.push({ phoneNormalized: phoneKey });

    if (!conditions.length) return NextResponse.json({ data: [] });

    const clients = await prisma.client.findMany({
      where: { OR: conditions },
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { preferredDate: "desc" },
          take: 1,
          select: { preferredDate: true, service: true },
        },
      },
      take: 10,
    });

    const data = clients
      .map((c) => {
        const emailMatch = !!apt.clientEmail && c.email === apt.clientEmail;
        const phoneMatch = !!phoneKey && c.phoneNormalized === phoneKey;
        return {
          ...c,
          matchedOn: emailMatch && phoneMatch ? "both" : emailMatch ? "email" : "phone",
          // email is the stronger signal, so it sorts first
          score: (emailMatch ? 2 : 0) + (phoneMatch ? 1 : 0),
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Client matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
