import { prisma } from "./prisma";
import { normalizePhone } from "./phone";

/**
 * Garantiza que la cita tenga una ficha de clienta vinculada: la encuentra por
 * correo o teléfono, o la crea. La usan "Compartir" (la dueña) y la reserva
 * desde la web (la clienta), así ninguna cita queda suelta de su clienta.
 *
 * Seguro ante llamadas simultáneas: las escrituras son condicionales
 * (`updateMany ... where clientId: null`), así que gana exactamente una y las
 * demás limpian lo que crearon.
 */
export async function ensureClient(
  appointmentId: string,
  contactPreference?: string | null,
): Promise<string> {
  const apt = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
  if (apt.clientId) return apt.clientId;

  const phoneKey = normalizePhone(apt.clientPhone);
  const conditions = [];
  if (apt.clientEmail) conditions.push({ email: apt.clientEmail });
  if (phoneKey) conditions.push({ phoneNormalized: phoneKey });

  const existing = conditions.length
    ? await prisma.client.findFirst({ where: { OR: conditions } })
    : null;

  if (existing) {
    // Lo que ella eligió en la reserva sólo llena un hueco; nunca pisa lo
    // que la dueña ya anotó.
    if (contactPreference && !existing.contactPreference) {
      await prisma.client.update({ where: { id: existing.id }, data: { contactPreference } });
    }
    await prisma.appointment.updateMany({
      where: { id: appointmentId, clientId: null },
      data: { clientId: existing.id },
    });
    const fresh = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      select: { clientId: true },
    });
    return fresh.clientId ?? existing.id;
  }

  const created = await prisma.client.create({
    data: {
      name: apt.clientName,
      email: apt.clientEmail || null,
      phone: apt.clientPhone || null,
      phoneNormalized: phoneKey,
      contactPreference: contactPreference ?? null,
    },
  });

  // Only attach if nobody linked one in the meantime.
  const claimed = await prisma.appointment.updateMany({
    where: { id: appointmentId, clientId: null },
    data: { clientId: created.id },
  });

  if (claimed.count === 1) return created.id;

  // Lost the race: another request already linked a client, so drop the
  // duplicate this call created and use the winner.
  await prisma.client.delete({ where: { id: created.id } }).catch(() => {});
  const winner = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    select: { clientId: true },
  });
  return winner.clientId ?? created.id;
}
