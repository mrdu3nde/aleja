"use client";

import { useSyncExternalStore } from "react";

/**
 * "Lo nuevo" en el panel, como cuando un carro Tesla se actualiza: al entrar
 * ella ve qué cambió, y cada sección nueva lleva una etiqueta "Nuevo" en el
 * menú hasta que la abre.
 *
 * Lo visto se guarda en el navegador (localStorage). Si lo borra o cambia de
 * teléfono vuelve a ver los avisos, que es inofensivo. Para anunciar algo
 * nuevo, se agrega una entrada con un `id` nuevo.
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

export const NOVEDADES: { id: string; items: Novedad[] } = {
  id: "2026-10-tour",
  items: [
    {
      href: "/studio",
      action: "tour",
      title: "Tour: cómo funciona tu panel",
      text: "Te mostramos paso a paso el circuito: crear la cita, enviarle el enlace, ella confirma y tú marcas el depósito. Tócalo para empezar.",
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
};

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
  const { id, items } = NOVEDADES;

  return {
    items,
    /** La tarjeta de novedades del inicio sigue abierta. */
    showCard: !has(`${id}:card`),
    dismissCard: () => mark(`${id}:card`),
    /** Esta sección del menú lleva "Nuevo". */
    isNew: (href: string) => items.some((i) => i.menu && i.href === href) && !has(`${id}:${href}`),
    markVisited: (href: string) => mark(`${id}:${href}`),
  };
}
