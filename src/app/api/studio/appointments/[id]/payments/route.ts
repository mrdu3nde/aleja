import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const paymentSchema = z.object({
  amount: z.number().positive().max(100000),
  method: z.enum(["cash", "zelle", "card", "transfer", "other"]).default("cash"),
  note: z.string().max(200).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = paymentSchema.parse(await request.json());

    // fails loudly if the appointment is gone, rather than orphaning the row
    const apt = await prisma.appointment.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });

    // Deleting a payment stays allowed — only taking new money is blocked.
    if (apt.status === "cancelled") {
      return NextResponse.json(
        { error: "cancelled", message: "This appointment is cancelled." },
        { status: 409 },
      );
    }

    const payment = await prisma.payment.create({
      data: {
        appointmentId: id,
        amount: data.amount,
        method: data.method,
        note: data.note || null,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId required" }, { status: 400 });
    }

    // scoped by appointment so one appointment cannot delete another's payment
    await prisma.payment.deleteMany({ where: { id: paymentId, appointmentId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
