import { NextResponse, after } from "next/server";
import { bookingSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendBookingAdminNotification } from "@/lib/email";
import { depositConfig, buildReferenceCode } from "@/lib/deposit";
import { resolveService } from "@/lib/services";
import { serviceDuration } from "@/lib/availability";
import { notifyOwner } from "@/lib/push";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    // The form posts a slug; store the real name and carry the fixed price over
    // so the booking arrives priced instead of blank.
    const resolved = await resolveService(data.service);
    const duration = await serviceDuration(data.service);

    const appointment = await prisma.appointment.create({
      data: {
        clientName: data.name,
        clientEmail: data.email,
        clientPhone: data.phone,
        service: resolved?.name ?? data.service,
        servicePrice: resolved?.price ?? null,
        preferredDate: data.preferredDate || null,
        preferredTime: data.preferredTime || null,
        durationMinutes: duration,
        message: data.message || null,
        source: "website",
        status: "pending",
        depositRequired: true,
        depositAmount: depositConfig.amount,
        depositStatus: "pending",
      },
    });

    const referenceCode = buildReferenceCode(appointment.id);

    const serviceName = resolved?.name ?? data.service;

    // Después de responder, pero con `after`: en Vercel la función se congela
    // al responder y un envío suelto podía no salir nunca.
    after(async () => {
      const results = await Promise.allSettled([
        sendBookingConfirmation({
          clientName: data.name,
          clientEmail: data.email,
          service: serviceName,
          preferredDate: data.preferredDate,
          referenceCode,
          depositAmount: depositConfig.amount,
          zelleName: depositConfig.zelleName,
          zellePhone: depositConfig.zellePhone,
        }),
        sendBookingAdminNotification({
          clientName: data.name,
          clientEmail: data.email,
          clientPhone: data.phone,
          service: serviceName,
          preferredDate: data.preferredDate,
          message: data.message,
        }),
      ]);
      for (const r of results) {
        if (r.status === "rejected") console.error("Booking email failed:", r.reason);
      }
      // Ella se entera al momento aunque el correo falle.
      await notifyOwner({
        title: `Nueva reserva: ${data.name}`,
        body: `${serviceName}${data.preferredDate ? ` · ${data.preferredDate}` : ""}${data.preferredTime ? ` ${data.preferredTime}` : ""}`,
        url: `/studio/appointments/${appointment.id}`,
      }).catch(console.error);
    });

    return NextResponse.json({
      success: true,
      id: appointment.id,
      referenceCode,
      deposit: {
        amount: depositConfig.amount,
        zelleName: depositConfig.zelleName,
        zellePhone: depositConfig.zellePhone,
      },
    });
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
