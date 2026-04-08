import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendBookingAdminNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    const appointment = await prisma.appointment.create({
      data: {
        clientName: data.name,
        clientEmail: data.email,
        clientPhone: data.phone,
        service: data.service,
        preferredDate: data.preferredDate || null,
        message: data.message || null,
        source: "website",
        status: "pending",
      },
    });

    // Send emails in background — don't block the response
    Promise.allSettled([
      sendBookingConfirmation({
        clientName: data.name,
        clientEmail: data.email,
        service: data.service,
        preferredDate: data.preferredDate,
      }),
      sendBookingAdminNotification({
        clientName: data.name,
        clientEmail: data.email,
        clientPhone: data.phone,
        service: data.service,
        preferredDate: data.preferredDate,
        message: data.message,
      }),
    ]).catch(console.error);

    return NextResponse.json({ success: true, id: appointment.id });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 },
      );
    }
    console.error("Booking API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
