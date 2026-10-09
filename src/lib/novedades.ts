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
