import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callScript } from "@/lib/call-script";

/**
 * Empieza una llamada de confirmación para esta cita.
 *
 * Hoy siempre es una DEMOSTRACIÓN: devuelve el guion para que el navegador lo
 * lea, y no se llama a nadie. La llamada real (Twilio, como en conasupo)
 * necesita un número y el consentimiento de la clienta; cuando exista, este es
 * el lugar donde se marca.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const apt = await prisma.appointment.findUniqueOrThrow({ where: { id } });
    if (apt.status === "cancelled") {
      return NextResponse.json({ error: "cancelled" }, { status: 409 });
    }

    const call = await prisma.appointmentCall.create({
      data: { appointmentId: id, mode: "demo" },
    });

    return NextResponse.json({
      callId: call.id,
      mode: call.mode,
      phone: apt.clientPhone,
      script: callScript(apt),
    });
  } catch (error) {
    console.error("Start call error:", error);
    return NextResponse.json({ error: "Failed to start" }, { status: 500 });
  }
}
