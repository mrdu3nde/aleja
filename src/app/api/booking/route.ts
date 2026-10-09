import { NextResponse, after } from "next/server";
import { bookingSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendBookingAdminNotification } from "@/lib/email";
import { depositConfig, buildReferenceCode } from "@/lib/deposit";
import { getDaySlots } from "@/lib/availability";
import { appointmentLabel, findItem, fixedPrice, isBookable } from "@/lib/catalog";
import { toMinutes } from "@/lib/time";
import { notifyOwner } from "@/lib/push";
import { ensureClient } from "@/lib/clients";

class SlotTaken extends Error {}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);
    const locale = data.locale === "es" ? "es" : "en";

    // La web reserva servicios de la carta, cada uno con su duración. Uno sin
    // duración todavía no se reserva en línea (se ve, pero se pide por teléfono).
    const item = findItem(data.service);
    if (!item || !isBookable(item)) {
      return NextResponse.json({ success: false, error: "not_bookable" }, { status: 400 });
    }
    const duration = item.durationMinutes!;

    // El formulario sólo ofrece horas libres, pero eso es lo que el navegador
    // vio hace un rato. Aquí se vuelve a mirar: dentro del horario y sin
    // cruzarse con nada.
    const day = await getDaySlots(data.preferredDate, duration);
    if (day.closed || !day.slots.includes(data.preferredTime)) {
      return NextResponse.json({ success: false, error: "slot_taken" }, { status: 409 });
    }

    const serviceName = appointmentLabel(item);
    const start = toMinutes(data.preferredTime);

    // Dos clientas pidiendo la misma hora a la vez: el candado por fecha hace
    // que la segunda espere a la primera y luego vea su cita.
    const appointment = await prisma
      .$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"booking:" + data.preferredDate}))`;
        const booked = await tx.appointment.findMany({
          where: {
            preferredDate: data.preferredDate,
            preferredTime: { not: null },
            status: { not: "cancelled" },
          },
          select: { preferredTime: true, durationMinutes: true },
        });
        const clash = booked.some((b) => {
          const s = toMinutes(b.preferredTime!);
          return start < s + (b.durationMinutes ?? 60) && start + duration > s;
        });
        if (clash) throw new SlotTaken();

        return tx.appointment.create({
          data: {
            clientName: data.name,
            clientEmail: data.email,
            clientPhone: data.phone,
            service: serviceName,
            servicePrice: fixedPrice(item.price),
            preferredDate: data.preferredDate,
            preferredTime: data.preferredTime,
            durationMinutes: duration,
            message: data.message || null,
            source: "website",
            status: "pending",
            depositRequired: true,
            depositAmount: depositConfig.amount,
            depositStatus: "pending",
          },
        });
      })
      .catch((err) => {
        if (err instanceof SlotTaken) return null;
        throw err;
      });

    if (!appointment) {
      return NextResponse.json({ success: false, error: "slot_taken" }, { status: 409 });
    }

    // La reserva web también queda en Clientas, con cómo prefiere que la
    // contacten. Si falla, la reserva sigue siendo válida: la dueña puede
    // vincularla a mano.
    await ensureClient(appointment.id, data.contactPreference).catch((err) =>
      console.error("Could not link client to web booking:", err),
    );

    const referenceCode = buildReferenceCode(appointment.id);

    // Después de responder, pero con `after`: en Vercel la función se congela
    // al responder y un envío suelto podía no salir nunca.
    after(async () => {
      const results = await Promise.allSettled([
        sendBookingConfirmation({
          clientName: data.name,
          clientEmail: data.email,
          service: item.name[locale],
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
        body: `${serviceName} · ${data.preferredDate} ${data.preferredTime}`,
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
