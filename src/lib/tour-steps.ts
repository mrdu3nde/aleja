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
    body: "En dos minutos te muestro cómo funciona ALUH: cómo te llegan las citas, cómo se confirman y dónde lo ves todo. Puedes salir cuando quieras y repetirlo después.",
  },
  {
    path: "/studio",
    target: "enlace-reservas",
    title: "Dos formas de llenar tu agenda",
    body: "La primera: comparte este enlace (WhatsApp o tu Instagram) y tu clienta se registra sola, eligiendo servicio, día y hora entre tus horarios libres. Te llega como cita pendiente de depósito, con su código de Zelle.",
  },
  {
    path: "/studio/availability",
    target: "horario",
    title: "Tus horarios libres",
    body: "El enlace sólo ofrece los días y horas que abres aquí, y nunca uno que ya esté ocupado. Si un día no trabajas, bloquéalo y desaparece de la página de reservas.",
  },
  {
    path: "/studio",
    target: "nueva-cita",
    title: "La segunda: créala tú",
    body: "Cuando una clienta te escribe por WhatsApp o Instagram, crea tú la cita aquí. Solo necesitas lo que ya sepas: nombre, teléfono y servicio.",
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
    title: "Envíale su enlace",
    body: "Toca \"Compartir cita\" y luego el botón verde de WhatsApp: se abre su chat con el mensaje listo. Es un enlace privado solo para ella.",
  },
  {
    path: "cita",
    title: "Ella confirma desde su teléfono",
    body: "Tu clienta abre el enlace, completa sus datos y ve cómo pagarte el depósito por Zelle. Si no hay depósito, con su confirmación la cita queda lista.",
  },
  {
    path: "cita",
    target: "pagos",
    title: "Marca el depósito",
    body: "Por cualquiera de los dos caminos, cuando te llegue el Zelle márcalo aquí como recibido: la cita queda confirmada. También anotas aquí lo que te paga el día del servicio.",
  },
  {
    path: "cita",
    target: "llamar",
    title: "Llamada de confirmación (demo)",
    body: "Un día antes puedes pedir que una voz llame a tu clienta: ella marca 1 para confirmar o 2 si no puede venir. Por ahora es una demostración: escúchala sin llamar a nadie.",
  },
  {
    path: "/studio/appointments",
    target: "citas-lista",
    title: "Dónde ver tus citas",
    body: "Aquí están todas, las que creaste tú y las que llegaron por tu enlace, con su estado: pendiente, confirmada, completada. Las que esperan depósito se ven marcadas. Si activas las notificaciones, te avisa al momento.",
  },
  {
    path: "/studio/clients",
    target: "clientas",
    title: "Tus clientas",
    body: "Cada clienta guarda su historial. Ábrela y usa \"Ficha técnica\" para anotar la fórmula, el corte, el mapping de mechas y las fotos de antes y después.",
  },
  {
    path: "/studio/gallery",
    target: "galeria-subir",
    title: "Tu galería",
    body: "Sube aquí las fotos de tus mejores trabajos. Salen en tu página web en el orden que elijas.",
  },
  {
    path: "/studio/notes",
    target: "mejoras-grabar",
    title: "Pide mejoras hablando",
    body: "¿Algo que cambiar en la plataforma? Toca y cuéntalo con tu voz. Te respondemos aquí mismo cuando quede hecho.",
  },
  {
    path: "/studio",
    target: "tour-boton",
    phoneTarget: "menu",
    title: "¡Listo!",
    body: "Ya conoces el circuito: ella reserva con tu enlace (o tú creas la cita y se la envías) → paga el depósito por Zelle → lo marcas y queda confirmada. Puedes repetir este tour cuando quieras desde \"Tour\" en el menú.",
  },
];
