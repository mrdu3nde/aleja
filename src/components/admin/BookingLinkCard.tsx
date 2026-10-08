"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Link2, MessageCircle } from "lucide-react";
import { copyText } from "@/lib/clipboard";

/**
 * "Tu enlace para reservar": la página pública donde la clienta se registra
 * sola y elige día y hora entre los horarios libres (los de Disponibilidad).
 * Es la otra forma de llenar la agenda, además de crear la cita ella misma y
 * enviar "Compartir cita". Aquí lo copia o lo manda por WhatsApp de un toque,
 * o lo pone en la biografía de Instagram.
 */

type Lang = "es" | "en";

const subscribeNever = () => () => {};

/** Igual que en Compartir: en localhost se usa la dirección real del sitio. */
function siteOrigin(): string {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(window.location.origin)
    ? process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    : window.location.origin;
}

const MESSAGE: Record<Lang, (url: string) => string> = {
  es: (url) => `¡Hola! Aquí puedes reservar tu cita en ALUH: eliges el servicio, el día y la hora que te queden mejor.\n\n${url}`,
  en: (url) => `Hi! You can book your ALUH appointment here: pick the service, day and time that suit you best.\n\n${url}`,
};

export function BookingLinkCard() {
  const origin = useSyncExternalStore(subscribeNever, siteOrigin, () => "");
  const [lang, setLang] = useState<Lang>("es");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const url = origin ? `${origin}/${lang}/${lang === "es" ? "reservar" : "book"}` : "";
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(MESSAGE[lang](url))}`;

  const copy = async () => {
    const ok = await copyText(url);
    setCopyFailed(!ok);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      data-tour="enlace-reservas"
      className="mb-8 rounded-2xl p-5"
      style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <Link2 className="h-5 w-5" />
            Tu enlace para reservar
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
            Compártelo y tu clienta se registra sola: elige el servicio, el día y la hora entre tus horarios
            libres. Te llega como cita pendiente de depósito.
          </p>
        </div>
        <div className="flex rounded-lg p-0.5 gap-0.5 shrink-0" style={{ backgroundColor: "var(--admin-filter-bg)" }}>
          {(["es", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              aria-label={l === "es" ? "Enlace en español" : "Enlace en inglés"}
              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase cursor-pointer ${lang === l ? "bg-[#6B4E3D] text-white" : ""}`}
              style={lang === l ? undefined : { color: "var(--admin-text)" }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <input
        readOnly
        value={url}
        aria-label="Enlace para reservar"
        onFocus={(e) => e.currentTarget.select()}
        className="mt-4 w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{
          border: "1px solid var(--admin-input-border)",
          backgroundColor: "var(--admin-input)",
          color: "var(--admin-text)",
        }}
      />
      {copyFailed && (
        <p className="mt-2 text-sm" style={{ color: "#B45309" }}>
          Tu navegador no dejó copiar. Mantén presionado el enlace para copiarlo.
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: "#1f8f4e", minHeight: 46 }}
        >
          <MessageCircle className="h-4 w-4" />
          Enviar por WhatsApp
        </a>
        <button
          onClick={copy}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer"
          style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)", minHeight: 46 }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--admin-muted)" }}>
        Idea: ponlo en la biografía de tu Instagram. Los horarios que ve salen de &quot;Disponibilidad&quot;.
      </p>
    </section>
  );
}
