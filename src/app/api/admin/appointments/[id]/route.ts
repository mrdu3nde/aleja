import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentUpdateSchema } from "@/lib/admin-validators";

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

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
