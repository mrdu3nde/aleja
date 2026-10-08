import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureClient } from "@/lib/clients";

/**
 * Prepare an appointment to be shared with the client.
 *
 * Two things happen here, both idempotent even under concurrent calls:
 *  1. a client record is guaranteed to exist and be linked, so whatever the
 *     client fills in on the public page lands on a real file
 *  2. an opaque token is minted once and reused on later shares, so a link
 *     already sent by WhatsApp keeps working
 *
 * The token is random rather than derived from the date and client id: a
 * predictable code would let anyone walk from one appointment to another.
 *
 * Concurrency matters here — a double click or a re-render loop used to fire
 * several shares at once and each would create its own client. Both writes are
 * therefore conditional (`updateMany ... where clientId: null`), so exactly one
 * caller wins and the losers clean up after themselves.
 */
async function ensureToken(appointmentId: string): Promise<void> {
  const token = randomBytes(16).toString("base64url");
  // Same trick: the first caller sets it, later ones are no-ops, so a link
  // already sent out never changes underneath the client.
  await prisma.appointment.updateMany({
    where: { id: appointmentId, shareToken: null },
    data: { shareToken: token, sharedAt: new Date() },
  });
}

/**
 * Copy anything the client's file already knows onto the appointment, so the
 * public page never asks her for a detail she has given before. Only fills
 * blanks — whatever the owner typed for this booking stays as typed.
 */
async function backfillFromClient(appointmentId: string, clientId: string) {
  const [apt, client] = await Promise.all([
    prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } }),
    prisma.client.findUnique({ where: { id: clientId } }),
  ]);
  if (!client) return;

  const data: Record<string, unknown> = {};
  if (!apt.clientEmail && client.email) data.clientEmail = client.email;
  if (!apt.clientPhone && client.phone) data.clientPhone = client.phone;

  if (Object.keys(data).length) {
    await prisma.appointment.update({ where: { id: appointmentId }, data });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // A cancelled booking has nothing to confirm, and the public page 404s on
    // it anyway — refuse here so no link is ever handed out for one.
    const apt = await prisma.appointment.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });
    if (apt.status === "cancelled") {
      return NextResponse.json(
        { error: "cancelled", message: "This appointment is cancelled." },
        { status: 409 },
      );
    }

    const clientId = await ensureClient(id);
    await backfillFromClient(id, clientId);
    await ensureToken(id);

    const updated = await prisma.appointment.update({
      where: { id },
      data: { sharedAt: new Date() },
      include: {
        client: { include: { _count: { select: { appointments: true } } } },
        payments: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Share appointment error:", error);
    return NextResponse.json({ error: "Failed to prepare share link" }, { status: 500 });
  }
}
