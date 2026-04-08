import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentUpdateSchema } from "@/lib/admin-validators";
import { sendAppointmentStatusUpdate } from "@/lib/email";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await prisma.appointment.findUniqueOrThrow({
      where: { id },
    });
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
    if (data.message !== undefined) updateData.message = data.message;
    if (data.status !== undefined) updateData.status = data.status;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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
