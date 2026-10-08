/**
 * El guion de la llamada de confirmación. Puro (sin servidor): lo usa la
 * demostración del navegador y, el día que haya Twilio, el TwiML de la
 * llamada real — así lo que ella escucha en la demo es lo mismo que oiría su
 * clienta.
 *
 * Adaptado del módulo de llamadas de conasupo (`src/lib/calls/core.ts`):
 * se presenta, dice que es un mensaje automático, y da tres opciones por
 * teclado. La opción 9 existe porque una llamada automática siempre debe
 * dejar pedir que no la vuelvan a llamar.
 */

export type CallInput = {
  clientName: string;
  service: string;
  preferredDate: string | null;
  preferredTime: string | null;
};

export type CallResult = "confirmed" | "declined" | "opt_out";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "2026-10-09" → "el viernes 9 de octubre". */
export function spokenDate(date: string | null): string | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `el ${DAYS[day]} ${d} de ${MONTHS[m - 1]}`;
}

/** "15:30" → "las 3 y 30 de la tarde". */
export function spokenTime(time: string | null): string | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [h, min] = time.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const part = h < 12 ? "de la mañana" : h < 19 ? "de la tarde" : "de la noche";
  const article = h12 === 1 ? "la" : "las";
  const minutes = min === 0 ? "" : min === 30 ? " y media" : ` y ${min}`;
  return `${article} ${h12}${minutes} ${part}`;
}

/** Sólo el primer nombre: así suena natural y no lee apellidos mal. */
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/** Las frases, una por una (la demo las va resaltando mientras las lee). */
export function callScript(input: CallInput): string[] {
  const when = [spokenDate(input.preferredDate), spokenTime(input.preferredTime) && `a ${spokenTime(input.preferredTime)}`]
    .filter(Boolean)
    .join(" ");
  return [
    `Hola ${firstName(input.clientName)}, te llamamos de ALUH.`,
    "Este es un mensaje automático para confirmar tu cita.",
    when
      ? `Tienes una cita de ${input.service} ${when}.`
      : `Tienes una cita de ${input.service} pendiente de fecha.`,
    "Para confirmar, marca 1.",
    "Si no puedes venir, marca 2.",
    "Para no recibir más llamadas automáticas, marca 9.",
  ];
}

export function digitResult(digit: string): CallResult | null {
  if (digit === "1") return "confirmed";
  if (digit === "2") return "declined";
  if (digit === "9") return "opt_out";
  return null;
}

/** Lo que dice la voz después de que la clienta marca. */
export const CALL_REPLY: Record<CallResult, string> = {
  confirmed: "¡Gracias! Tu cita quedó confirmada. Te esperamos en ALUH.",
  declined: "Entendido. Le avisaremos a ALUH para buscarte otro horario. Gracias.",
  opt_out: "Listo, no te volveremos a llamar con mensajes automáticos. Gracias.",
};

/** Cómo se lo contamos a ella en el panel. */
export const CALL_RESULT_LABEL: Record<CallResult, string> = {
  confirmed: "Confirmó (marcó 1)",
  declined: "No puede venir (marcó 2)",
  opt_out: "Pidió no recibir llamadas (marcó 9)",
};
