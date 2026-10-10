"use client";

import { useSyncExternalStore } from "react";

/**
 * "Lo nuevo" en el panel, como cuando un carro Tesla se actualiza: al entrar
 * ella ve qué cambió, y cada sección nueva lleva una etiqueta "Nuevo" en el
 * menú hasta que la abre. Todas las actualizaciones quedan en Novedades
 * (/studio/novedades), con su fecha, aunque ya haya cerrado la tarjeta.
 *
 * Lo visto se guarda en el navegador (localStorage) para que la tarjeta y las
 * etiquetas reaccionen al instante; además se registra en la base (UpdateView)
 * para saber quién lo vio y cuándo.
 *
 * Para anunciar algo nuevo: se agrega una actualización AL PRINCIPIO de
 * RELEASES, con un `id` nuevo y la fecha en que se publica.
 */

export type Novedad = {
  /** Se abre al tocarla. Una ruta del panel, o el sitio público. */
  href: string;
  /** En vez de abrir `href`, hace algo: "tour" empieza el tour guiado. */
  action?: "tour";
  /** Si la sección del menú debe llevar "Nuevo" hasta que la visite. */
  menu?: boolean;
  title: string;
  text: string;
};

export type Release = {
  id: string;
  /** "YYYY-MM-DD", el día en que se publicó. */
  date: string;
  title: string;
  items: Novedad[];
};

/** La más reciente primero. */
export const RELEASES: Release[] = [
  {
    id: "2026-10-todo-lo-que-pediste",
    date: "2026-10-10",
    title: "Todo lo que pediste, punto por punto",
    items: [
      {
        href: "/es",
        title: "1. Logo ALUH",
        text: "Solo ALUH, en mayúsculas, más grande y en dorado champagne, sin \"Beauty Studio\". Abajo dice PRESENCE IS POWER, y el sitio tiene toques de dorado.",
      },
      {
        href: "/es",
        title: "2. Portada",
        text: "Dice BEAUTY, ELEVATED. y \"Belleza personalizada, pensada con cuidado para ti\". Donde decía \"Por qué elegir ALUH\" ahora dice THE ALUH EXPERIENCE: Personalized. Refined. Intentional.",
      },
      {
        href: "/es",
        title: "3. Sin \"Nuestros Servicios\"",
        text: "Quitamos el título \"Nuestros Servicios\" y su frase, en la portada y en la página de servicios, en español y en inglés. Ahora salen directamente las categorías.",
      },
      {
        href: "/es/servicios",
        title: "4. Cabello",
        text: "Balayage y highlights desde $350 (5 a 6 horas, con prueba de mechón), cortes, tratamiento nutritivo y blowouts, con tus precios y tus textos.",
      },
      {
        href: "/es/servicios",
        title: "5. Pestañas y cejas",
        text: "Lifting $85, Lifting y Tinte $95, Set Clásico $100, Híbrido $115, Wispy $120, Anime $120 y Volumen $120. Cejas: Laminado $85 y Depilación con cera $25. Borramos los servicios viejos de pestañas y cejas.",
      },
      {
        href: "/es/servicios",
        title: "6. Uñas",
        text: "Quitamos el servicio de uñas del sitio.",
      },
      {
        href: "/es/reservar",
        title: "7. Reservar en 5 pasos (ya funciona con todos tus servicios)",
        text: "Categoría → servicio con su precio → día y hora libres → datos de la clienta → depósito de $25. Ya se pueden reservar en línea las pestañas, cejas, cortes, tratamientos y blowouts. Les pusimos una duración aproximada; abajo te preguntamos la real para ajustarla.",
      },
      {
        href: "/studio/availability",
        title: "8. Tu horario",
        text: "Lunes a viernes de 10:00 a. m. a 5:00 p. m., sábados de 10:00 a. m. a 2:00 p. m. y domingos cerrado. También en el pie de página. Ninguna cita termina fuera de tu horario ni se cruza con otra.",
      },
      {
        href: "/es/reservar",
        title: "9. Depósito de $25",
        text: "Al reservar, la clienta ve el total, el depósito de $25 y lo que le queda por pagar, con tu política antes de pagar. Lo paga por Zelle al +1 (747) 250-0852; la cita queda confirmada cuando tú confirmas que llegó el pago.",
      },
      {
        href: "/es/resenas",
        title: "10. ¡Cuéntanos tu experiencia!",
        text: "Pestaña nueva en el menú con tu texto: nombre, estrellas de 1 a 5, comentario y el botón \"Enviar reseña\". No hay reseñas inventadas. Cada reseña te llega aquí y sale en la web cuando tú tocas \"Publicar\".",
      },
      {
        href: "/es",
        title: "11. Teléfono e Instagram",
        text: "En todo el sitio está +1 (747) 786-4169 (al tocarlo, llama) y tu Instagram @aluhstudio.",
      },
      {
        href: "/en",
        title: "12. Español e inglés",
        text: "El sitio completo está en los dos idiomas, con el selector arriba. Al cambiar de idioma te quedas en la misma página. Wispy y Anime se llaman igual en los dos.",
      },
      {
        href: "/es/sobre",
        title: "13. Sobre ALUH",
        text: "Tu historia completa, LA EXPERIENCIA ALUH, y PRESENCE IS POWER como firma al final de la página.",
      },
      {
        href: "/studio/gallery",
        menu: true,
        title: "14. Galería",
        text: "Quitamos las fotos de ejemplo. Desde aquí subes tus 10 mejores fotos y salen en la web al instante.",
      },
      {
        href: "/studio/clients",
        title: "15. Ficha técnica de cada clienta",
        text: "Abre una clienta → \"Ficha técnica\": fórmula, corte o peinado, mapping de mechas, notas, foto del antes y del después, y lo que se hizo antes en otro lugar.",
      },
      {
        href: "/studio/notes",
        menu: true,
        title: "Tengo unas preguntas para ti",
        text: "Las encuentras en Mejoras. Mientras no contestes, todo sigue funcionando como está.",
      },
    ],
  },
  {
    id: "2026-10-reservas-resenas",
    date: "2026-10-09",
    title: "Tus servicios en la web, horario nuevo y reseñas",
    items: [
      {
        href: "/es/book",
        title: "Reservar paso a paso",
        text: "Tu clienta elige la categoría, el servicio con su precio, el día y la hora libres, deja sus datos y ve el total, el depósito de $25 y lo que le queda por pagar, con tu política antes de enviar.",
      },
      {
        href: "/es/services",
        title: "Pestañas y cejas nuevas",
        text: "Pusimos tus servicios de pestañas y cejas con sus precios y textos, y quitamos el encabezado \"Nuestros Servicios\". Los que todavía no tienen duración se ven con su precio, pero se reservan llamándote.",
      },
      {
        href: "/studio/availability",
        title: "Tu horario",
        text: "Lunes a viernes de 10 a 5, sábados de 10 a 2 y domingos cerrado. Cada cita tiene que terminar dentro de tu horario y nunca se cruza con otra.",
      },
      {
        href: "/studio/reviews",
        menu: true,
        title: "Reseñas",
        text: "En la web hay una pestaña \"¡Cuéntanos tu experiencia!\". Cuando una clienta deja su reseña te llega un aviso, y sólo sale en la página cuando tú tocas \"Publicar\".",
      },
      {
        href: "/es",
        title: "Tu teléfono e Instagram",
        text: "En todo el sitio está tu número +1 (747) 786-4169 (al tocarlo, llama) y tu Instagram @aluhstudio.",
      },
    ],
  },
  {
    id: "2026-10-tour",
    date: "2026-10-08",
    title: "Tour guiado, enlace para reservar y llamada de prueba",
    items: [
      {
        href: "/studio",
        action: "tour",
        title: "Tour: cómo funciona tu panel",
        text: "Te mostramos paso a paso cómo te llegan las citas, cómo se confirman y dónde lo ves todo. Tócalo para empezar.",
      },
      {
        href: "/studio",
        title: "Tu enlace para reservar",
        text: "En Inicio tienes tu enlace de reservas: compártelo por WhatsApp o ponlo en tu Instagram y tu clienta se registra sola, eligiendo día y hora entre tus horarios libres.",
      },
      {
        href: "/studio/appointments",
        title: "Enviar por WhatsApp en un toque",
        text: "Al compartir una cita, el botón verde abre WhatsApp en el chat de tu clienta con el mensaje ya escrito.",
      },
      {
        href: "/studio/appointments",
        title: "Llamada de confirmación (demo)",
        text: "En cada cita puedes escuchar cómo sería una llamada automática que le pide a tu clienta marcar 1 para confirmar o 2 si no puede venir.",
      },
      {
        href: "/studio/novedades",
        menu: true,
        title: "Este historial",
        text: "Todo lo que cambia en tu plataforma queda aquí, con su fecha, para volver a verlo cuando quieras.",
      },
    ],
  },
  {
    id: "2026-10-rediseno",
    date: "2026-10-07",
    title: "La nueva imagen de ALUH",
    items: [
      {
        href: "/es",
        title: "Tu sitio con la nueva imagen",
        text: "Logo ALUH en dorado champagne, BEAUTY, ELEVATED en la portada, THE ALUH EXPERIENCE, tu historia, y tus servicios y precios. Uñas ya no aparece.",
      },
      {
        href: "/studio/gallery",
        menu: true,
        title: "Galería",
        text: "Quitamos las fotos de muestra. Sube aquí tus mejores trabajos y elige su orden; las primeras cuatro salen también en el inicio.",
      },
      {
        href: "/studio/clients",
        menu: true,
        title: "Ficha técnica de cada clienta",
        text: "Abre una clienta y toca \"Anotar servicio\": fórmula, corte o peinado, mapping de mechas y fotos de antes y después. También hay un espacio para lo que se hizo antes de venir a ALUH.",
      },
    ],
  },
  {
    id: "2026-09-voz",
    date: "2026-09-20",
    title: "Pide mejoras hablando",
    items: [
      {
        href: "/studio/notes",
        title: "Mejoras por voz",
        text: "Toca y cuenta lo que quieres cambiar; se pasa a texto solo. Te respondemos en la misma mejora, y si nos falta algo te preguntamos ahí.",
      },
    ],
  },
  {
    id: "2026-09-huella",
    date: "2026-09-19",
    title: "Entrar con tu huella o tu cara",
    items: [
      {
        href: "/studio/security",
        title: "Acceso con huella o cara",
        text: "El panel se abre con la huella o la cara de tu teléfono, sin contraseñas. En Seguridad ves y quitas los dispositivos que tienen acceso.",
      },
    ],
  },
  {
    id: "2026-07-agenda",
    date: "2026-07-27",
    title: "Tu horario y el panel en español",
    items: [
      {
        href: "/studio/availability",
        title: "Disponibilidad",
        text: "Defines los días y horas que trabajas y bloqueas tus días libres; la página de reservas sólo ofrece esos horarios.",
      },
      {
        href: "/studio/content",
        title: "Tus servicios desde el panel",
        text: "Precios, duración y fotos de cada servicio se cambian en Contenido, sin tocar código.",
      },
    ],
  },
  {
    id: "2026-07-cobros",
    date: "2026-07-26",
    title: "Pagos y citas compartidas",
    items: [
      {
        href: "/studio/appointments",
        title: "Compartir la cita con la clienta",
        text: "Creas la cita y le envías un enlace privado para que complete sus datos y vea el depósito.",
      },
      {
        href: "/studio/appointments",
        title: "Pagos de cada cita",
        text: "Precio, depósito, abonos y lo que falta por cobrar, en un solo lugar.",
      },
    ],
  },
  {
    id: "2026-05-zelle",
    date: "2026-05-17",
    title: "Depósito por Zelle",
    items: [
      {
        href: "/studio/appointments",
        title: "Depósito para apartar la cita",
        text: "La clienta ve tus datos de Zelle y un código de referencia; cuando marcas el depósito recibido, la cita queda confirmada.",
      },
    ],
  },
  {
    id: "2026-04-inicio",
    date: "2026-04-07",
    title: "Nace la plataforma ALUH",
    items: [
      {
        href: "/es",
        title: "Tu sitio web y tu panel",
        text: "La página de ALUH en español e inglés, con reservas en línea, y este panel para manejar tus citas y clientas.",
      },
    ],
  },
];

/** La que anuncia la tarjeta del inicio. */
export const LATEST = RELEASES[0];

/** Anota en la base que se vio. Nunca falla hacia afuera: dice si quedó. */
export async function recordView(
  releaseId: string,
  event: "visto" | "entendido" | "historial",
): Promise<boolean> {
  try {
    const res = await fetch("/api/studio/novedades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releaseId, event }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Evita registrar dos veces mientras la primera petición va en camino.
let logging = false;

const KEY = "studio-novedades";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function mark(token: string) {
  try {
    const seen = read();
    if (seen.includes(token)) return;
    localStorage.setItem(KEY, JSON.stringify([...seen, token]));
  } catch {
    // Sin almacenamiento (modo privado): el aviso simplemente vuelve a salir.
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// La lista vista como texto, para que useSyncExternalStore compare por valor.
const snapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
};
// En el servidor no se sabe qué vio: se asume todo visto, así nada parpadea.
const serverSnapshot = () => "*";

export function useNovedades() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const seen = raw === "*" ? null : (JSON.parse(raw) as string[]);
  const has = (token: string) => seen === null || seen.includes(token);

  // Secciones del menú anunciadas en cualquier actualización, con la suya.
  const menuItems = RELEASES.flatMap((r) =>
    r.items.filter((i) => i.menu).map((i) => ({ releaseId: r.id, href: i.href })),
  );

  return {
    release: LATEST,
    /** La tarjeta de novedades del inicio sigue abierta. */
    showCard: !has(`${LATEST.id}:card`),
    dismissCard: () => {
      mark(`${LATEST.id}:card`);
      void recordView(LATEST.id, "entendido");
    },
    /** Registra en la base que la tarjeta se mostró, una vez por navegador. */
    logShown: () => {
      if (logging || has(`${LATEST.id}:logged`)) return;
      logging = true;
      // Sólo se da por registrado cuando el servidor lo guardó; si falla, se
      // reintenta la próxima vez que se muestre la tarjeta.
      recordView(LATEST.id, "visto").then((ok) => {
        logging = false;
        if (ok) mark(`${LATEST.id}:logged`);
      });
    },
    /** Esta sección del menú lleva "Nuevo". */
    isNew: (href: string) => menuItems.some((m) => m.href === href && !has(`${m.releaseId}:${href}`)),
    markVisited: (href: string) => {
      for (const m of menuItems) if (m.href === href) mark(`${m.releaseId}:${href}`);
    },
  };
}
