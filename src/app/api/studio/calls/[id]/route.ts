import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { digitResult } from "@/lib/call-script";

const schema = z.object({
  // Lo que "marcó" la clienta en la demo; vacío = colgó sin marcar.
  digit: z.string().max(1).optional(),
});

/**
 * Cierra una llamada de DEMOSTRACIÓN con lo que se marcó.
 *
 * A propósito no toca la cita: en la demo nadie contestó de verdad. En modo
 * real, el webhook de Twilio sí confirmaría o liberaría la cita.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { digit } = schema.parse(await request.json());
    const current = await prisma.appointmentCall.findUniqueOrThrow({ where: { id } });
    if (current.mode !== "demo") {
      return NextResponse.json({ error: "not_demo" }, { status: 409 });
    }
    const result = digit ? digitResult(digit) : null;
    const call = await prisma.appointmentCall.update({
      where: { id },
      data: {
        status: result ? "completed" : "no_answer",
        result,
        digits: digit ?? null,
      },
    });
    return NextResponse.json(call);
  } catch (error) {
    console.error("Finish call error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}
