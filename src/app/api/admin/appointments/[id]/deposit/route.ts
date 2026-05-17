import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDepositConfirmation } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action: "received" | "unmark" = body.action ?? "received";

    const current = await prisma.appointment.findUniqueOrThrow({ where: { id } });

    if (action === "unmark") {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          depositStatus: "pending",
          depositReceivedAt: null,
          status: current.status === "confirmed" ? "pending" : current.status,
        },
      });
      return NextResponse.json(appointment);
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        depositStatus: "received",
        depositReceivedAt: new Date(),
        status: "confirmed",
      },
    });

    if (current.depositStatus !== "received" && appointment.clientEmail) {
      sendDepositConfirmation({
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        service: appointment.service,
        preferredDate: appointment.preferredDate,
        depositAmount: Number(appointment.depositAmount ?? 20),
      }).catch(console.error);
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Mark deposit error:", error);
    return NextResponse.json(
      { error: "Failed to update deposit" },
      { status: 500 },
    );
  }
}
