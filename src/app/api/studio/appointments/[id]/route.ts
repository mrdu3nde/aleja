import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentUpdateSchema } from "@/lib/admin-validators";
import { sendAppointmentStatusUpdate } from "@/lib/email";
import { resolveDeposit } from "@/lib/deposit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await prisma.appointment.findUniqueOrThrow({
      where: { id },
      include: {
        client: { include: { _count: { select: { appointments: true } } } },
        payments: { orderBy: { createdAt: "asc" } },
      },
    });
    // Opening the appointment is the acknowledgement — clear the "new
    // confirmation" badge so the counter reflects what is still unread.
    if (data.clientConfirmedAt && !data.confirmationSeen) {
      await prisma.appointment.update({
        where: { id },
        data: { confirmationSeen: true },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get appointment error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = appointmentUpdateSchema.parse(body);

    // Get current appointment to detect status change
    const current = await prisma.appointment.findUniqueOrThrow({ where: { id } });

    const updateData: Record<string, unknown> = {};
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
    if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone;
    if (data.service !== undefined) updateData.service = data.service;
    if (data.preferredDate !== undefined) updateData.preferredDate = data.preferredDate;
    if (data.preferredTime !== undefined) updateData.preferredTime = data.preferredTime;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.servicePrice !== undefined) updateData.servicePrice = data.servicePrice;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.depositRequired !== undefined || data.depositAmount !== undefined) {
      const current = await prisma.appointment.findUniqueOrThrow({
        where: { id },
        select: { depositRequired: true, depositAmount: true },
      });
      // Setting a positive amount re-enables the deposit: otherwise a booking
      // dropped to $0 could never be given a deposit again from the UI.
      const required =
        data.depositRequired ??
        (data.depositAmount !== undefined
          ? data.depositAmount > 0
          : current.depositRequired);

      Object.assign(
        updateData,
        resolveDeposit(required, data.depositAmount ?? Number(current.depositAmount ?? 0)),
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      // the detail page replaces its state with this response — without the
      // relation the linked client would vanish from the UI after any edit
      include: {
        client: { include: { _count: { select: { appointments: true } } } },
        payments: { orderBy: { createdAt: "asc" } },
      },
    });

    // Send email if status changed to confirmed, cancelled, or completed
    if (
      data.status &&
      data.status !== current.status &&
      ["confirmed", "cancelled", "completed"].includes(data.status) &&
      appointment.clientEmail
    ) {
      sendAppointmentStatusUpdate({
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        service: appointment.service,
        preferredDate: appointment.preferredDate,
        status: data.status,
      }).catch(console.error);
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
