import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validators";
import { sendToN8N } from "@/lib/n8n";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    await Promise.allSettled([
      sendToN8N(process.env.N8N_BOOKING_WEBHOOK_URL ?? "", {
        ...data,
        timestamp: new Date().toISOString(),
        type: "booking_request",
      }),
      prisma.appointment.create({
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
      }),
    ]);

    return NextResponse.json({ success: true });
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
