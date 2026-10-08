/**
 * El tour guiado del panel: cómo funciona ALUH de principio a fin.
 *
 * Cada paso abre una pantalla (`path`) y, si encuentra el elemento marcado con
 * `data-tour="<target>"`, lo ilumina. Si no está (por ejemplo en el teléfono,
 * donde el menú va escondido), la explicación sale sola, sin foco.
 *
 * `path: "cita"` es la cita más reciente que no esté cancelada, para enseñar
 * el botón de compartir sobre una cita real suya.
 */
export type TourStep = {
  path: string | "cita";
  target?: string;
  /** Si `target` no se ve (en el teléfono, dentro del menú cerrado), éste. */
  phoneTarget?: string;
  title: string;
  body: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/studio",
    title: "Bienvenida a tu panel ✨",
    body: "En dos minutos te muestro cómo funciona ALUH: desde que una clienta te escribe hasta que llega a su cita. Puedes salir cuando quieras y repetirlo después.",
  },
  {
    path: "/studio",
    target: "nueva-cita",
    title: "1. Crea la cita",
    body: "Cuando una clienta te escribe por WhatsApp o Instagram, crea su cita aquí. Solo necesitas lo que ya sepas: nombre, teléfono y servicio.",
  },
  {
    path: "/studio/appointments/new",
    target: "nueva-cita-form",
    title: "Llena lo que sepas",
    body: "Nombre, teléfono, servicio, día y hora. Lo que falte (correo, detalles) lo completa ella después con el enlace. Al guardar, vas directo a compartirlo.",
  },
  {
    path: "cita",
    target: "compartir",
    title: "2. Envíale el enlace",
    body: "Toca \"Compartir cita\" y envíaselo por WhatsApp. Es un enlace privado solo para ella.",
  },
  {
    path: "cita",
    title: "3. Ella confirma desde su teléfono",
    body: "Tu clienta abre el enlace, completa sus datos y ve cómo pagarte el depósito por Zelle. Si no hay depósito, con su confirmación la cita queda lista.",
  },
  {
    path: "cita",
    target: "pagos",
    title: "4. Marca el depósito",
    body: "Cuando te llegue el Zelle, márcalo aquí como recibido. Ahí la cita queda confirmada. También anotas aquí lo que te paga el día del servicio.",
  },
  {
    path: "cita",
    target: "llamar",
    title: "5. Llamada de confirmación (demo)",
    body: "Un día antes puedes pedir que una voz llame a tu clienta: ella marca 1 para confirmar o 2 si no puede venir. Por ahora es una demostración: escúchala sin llamar a nadie.",
  },
  {
    path: "/studio/appointments",
    target: "citas-lista",
    title: "6. Dónde ver tus citas",
    body: "Aquí están todas, con su estado: pendiente, confirmada, completada. Las que esperan depósito se ven marcadas. En Inicio tienes el resumen del día.",
  },
  {
    path: "/studio/clients",
    target: "clientas",
    title: "7. Tus clientas",
    body: "Cada clienta guarda su historial. Ábrela y usa \"Ficha técnica\" para anotar la fórmula, el corte, el mapping de mechas y las fotos de antes y después.",
  },
  {
    path: "/studio/gallery",
    target: "galeria-subir",
    title: "8. Tu galería",
    body: "Sube aquí las fotos de tus mejores trabajos. Salen en tu página web en el orden que elijas.",
  },
  {
    path: "/studio/notes",
    target: "mejoras-grabar",
    title: "9. Pide mejoras hablando",
    body: "¿Algo que cambiar en la plataforma? Toca y cuéntalo con tu voz. Te respondemos aquí mismo cuando quede hecho.",
  },
  {
    path: "/studio",
    target: "tour-boton",
    phoneTarget: "menu",
    title: "¡Listo!",
    body: "Ya conoces el circuito: crear la cita → enviar el enlace → ella confirma → marcas el depósito. Puedes repetir este tour cuando quieras desde \"Tour\" en el menú.",
  },
];
