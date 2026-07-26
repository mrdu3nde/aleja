import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { depositConfig, buildReferenceCode } from "@/lib/deposit";
import { notifyOwner } from "@/lib/push";
import { sendClientConfirmedNotification } from "@/lib/email";

/**
 * Public endpoint — reachable by anyone holding the link, with no session.
 *
 * It deliberately returns only what the client already knows about her own
 * booking (her name, the service, the date and time). No ids, no internal
 * status, no other client's data, and never a list.
 */
function publicView(apt: {
  clientName: string;
  service: string;
  preferredDate: string | null;
  preferredTime: string | null;
  clientEmail: string;
  clientPhone: string | null;
  clientConfirmedAt: Date | null;
  id: string;
  status: string;
  depositRequired: boolean;
  depositAmount: unknown;
}) {
  return {
    clientName: apt.clientName,
    service: apt.service,
    preferredDate: apt.preferredDate,
    preferredTime: apt.preferredTime,
    alreadyConfirmed: apt.clientConfirmedAt !== null,
    // lets the page say "confirmed" vs "we'll confirm once the deposit lands"
    confirmed: apt.status === "confirmed",
    // which fields the page needs to ask for
    missing: {
      phone: !apt.clientPhone,
      email: !apt.clientEmail,
    },
    deposit: apt.depositRequired
      ? {
          amount: Number(apt.depositAmount ?? depositConfig.amount),
          zelleName: depositConfig.zelleName,
          zellePhone: depositConfig.zellePhone,
          referenceCode: buildReferenceCode(apt.id),
        }
      : null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const apt = await prisma.appointment.findUnique({ where: { shareToken: token } });

    if (!apt || apt.status === "cancelled") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(publicView(apt));
  } catch (error) {
    console.error("Public confirm fetch error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    const apt = await prisma.appointment.findUnique({ where: { shareToken: token } });
    if (!apt || apt.status === "cancelled") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Only fill gaps — the client cannot overwrite what the owner already set,
    // and cannot touch the date, time or service.
    const aptData: Record<string, unknown> = { clientConfirmedAt: new Date(), confirmationSeen: false };
    if (!apt.clientPhone && phone) aptData.clientPhone = phone;
    if (!apt.clientEmail && email) aptData.clientEmail = email;

    // Status is the one exception, and it is driven by the deposit rather than
    // by the client:
    //   no deposit  → her confirmation is the whole story, book it now
    //   deposit due → stays pending until the money lands and the owner marks
    //                 it received, which is what flips it to confirmed
    // Without this a deposit-free booking would sit in "pending" forever, since
    // there is no payment step left to trigger the change.
    const confirmsImmediately = !apt.depositRequired && apt.status === "pending";
    if (confirmsImmediately) aptData.status = "confirmed";

    const updated = await prisma.appointment.update({
      where: { id: apt.id },
      data: aptData,
    });

    // Fill the gaps in the client's file — and only the gaps.
    //
    // The source is the *updated* appointment rather than just the form, because
    // the form only asks for what the appointment is missing. A booking the
    // owner typed an email into would otherwise never pass it on to a client
    // record created without one.
    //
    // Anything already on file wins: the owner's own corrections are never
    // overwritten by what a client types into a public page.
    if (apt.clientId) {
      const client = await prisma.client.findUnique({ where: { id: apt.clientId } });
      if (client) {
        const clientData: Record<string, unknown> = {};

        if (!client.phone && updated.clientPhone) {
          clientData.phone = updated.clientPhone;
          clientData.phoneNormalized = normalizePhone(updated.clientPhone);
        }

        if (!client.email && updated.clientEmail) {
          // email is unique — skip silently if another file already owns it,
          // rather than blowing up her confirmation over a duplicate
          const taken = await prisma.client.findUnique({
            where: { email: updated.clientEmail },
          });
          if (!taken) clientData.email = updated.clientEmail;
        }

        if (Object.keys(clientData).length) {
          await prisma.client.update({ where: { id: client.id }, data: clientData });
        }
      }
    }

    // Fire-and-forget: the client should never wait on our notifications
    notifyOwner({
      title: `${updated.clientName} confirmed`,
      body: `${updated.service}${updated.preferredDate ? ` · ${updated.preferredDate}` : ""}${updated.preferredTime ? ` ${updated.preferredTime}` : ""}`,
      url: `/studio/appointments/${updated.id}`,
    }).catch(console.error);

    sendClientConfirmedNotification({
      clientName: updated.clientName,
      clientEmail: updated.clientEmail,
      clientPhone: updated.clientPhone,
      service: updated.service,
      preferredDate: updated.preferredDate,
      preferredTime: updated.preferredTime,
      appointmentId: updated.id,
    }).catch(console.error);

    return NextResponse.json(publicView(updated));
  } catch (error) {
    console.error("Public confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm" }, { status: 500 });
  }
}
