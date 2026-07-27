"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Copy, Check, AlertCircle } from "lucide-react";
import { copyText } from "@/lib/clipboard";

type Props = {
  open: boolean;
  appointmentId: string;
  clientName: string;
  service: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  onClose: () => void;
  onShared: () => void;
};

type Lang = "es" | "en";

const MONTHS: Record<Lang, string[]> = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const DAYS: Record<Lang, string[]> = {
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

function formatDate(iso: string | null | undefined, lang: Lang) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = DAYS[lang][new Date(y, m - 1, d).getDay()];
  return lang === "es"
    ? `${weekday} ${d} de ${MONTHS.es[m - 1]}`
    : `${weekday}, ${MONTHS.en[m - 1]} ${d}`;
}

function formatTime(hhmm: string | null | undefined) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${period}`;
}

function buildMessage(
  lang: Lang,
  name: string,
  service: string,
  date: string | null,
  time: string | null,
  url: string,
) {
  const first = name.split(" ")[0];

  // No money in the message. Amounts, Zelle details and the reference code all
  // live on the page the link opens — one place to read them, one place to keep
  // correct if a price changes.
  if (lang === "es") {
    const when = date ? ` para el ${date}${time ? ` a las ${time}` : ""}` : "";
    return `¡Listo ${first}! Hemos creado tu cita de ${service}${when}. Solo completa un par de datos para confirmarla:\n\n${url}`;
  }

  const when = date ? ` for ${date}${time ? ` at ${time}` : ""}` : "";
  return `All set, ${first}! We've created your ${service} appointment${when}. Just fill in a couple of details to confirm it:\n\n${url}`;
}

export function ShareAppointmentModal({
  open,
  appointmentId,
  clientName,
  service,
  preferredDate,
  preferredTime,
  onClose,
  onShared,
}: Props) {
  const [shared, setShared] = useState<{
    shareToken: string;
    depositRequired: boolean;
    depositAmount: string | number | null;
  } | null>(null);
  const [lang, setLang] = useState<Lang>("es");
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  // Kept in a ref so a new callback identity from the parent cannot retrigger
  // the effect: onShared bumps the parent's state, which re-renders, which used
  // to hand us a fresh function, which re-ran this effect — an endless loop that
  // hammered /share and could create the client twice.
  const onSharedRef = useRef(onShared);
  useEffect(() => {
    onSharedRef.current = onShared;
  }, [onShared]);

  useEffect(() => {
    if (!open) return;

    // No "only once" guard here on purpose. React remounts effects in
    // development, and a guard would skip the second run while the first run's
    // result had already been discarded by its cleanup — the sheet then sat on
    // "Preparing link..." forever. Duplicate calls are safe: /share is atomic
    // and returns the same client and the same token every time.
    let cancelled = false;

    const mint = async () => {
      setError(false);
      try {
        const res = await fetch(`/api/studio/appointments/${appointmentId}/share`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();
        const apt = await res.json();
        if (cancelled) return;
        setShared(apt);
        onSharedRef.current();
      } catch {
        if (!cancelled) setError(true);
      }
    };

    mint();
    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copy = useCallback(async (text: string, what: "link" | "message") => {
    const ok = await copyText(text);
    if (ok) {
      setCopyFailed(false);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } else {
      // never fail silently — tell her to select it by hand
      setCopied(null);
      setCopyFailed(true);
    }
  }, []);

  if (!open) return null;

  // A link built from window.location is useless when the studio is open on
  // localhost: the client's phone cannot resolve it. Fall back to the
  // configured site URL in that case, and keep the current origin otherwise so
  // browsing from another device still produces a link that points back here.
  const origin =
    typeof window !== "undefined" &&
    !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(window.location.origin)
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";

  // The language rides along in the link, so the page she opens matches the
  // message she was sent.
  const url = shared
    ? `${origin}/confirm/${shared.shareToken}${lang === "en" ? "?lang=en" : ""}`
    : "";

  const message = shared
    ? buildMessage(
        lang,
        clientName,
        service,
        formatDate(preferredDate, lang),
        formatTime(preferredTime),
        url,
      )
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compartir cita"
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl w-full max-w-lg shadow-xl flex flex-col"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
          maxHeight: "85vh",
        }}
      >
        <div className="p-5 pb-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold flex-1 min-w-0" style={{ color: "var(--admin-text)" }}>
              Compartir cita
            </h3>

            {/* Language sits with the title: it governs both the message and the
                page she lands on, not just the block below. */}
            {shared && (
              <div className="flex rounded-lg p-0.5 gap-0.5 shrink-0" style={{ backgroundColor: "var(--admin-filter-bg)" }}>
                {(["es", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    aria-label={l === "es" ? "Español" : "English"}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase cursor-pointer transition-colors ${
                      lang === l ? "bg-[#6B4E3D] text-white" : ""
                    }`}
                    style={lang === l ? undefined : { color: "var(--admin-text)" }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-lg cursor-pointer shrink-0"
              style={{ color: "var(--admin-muted)" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
            Ella completa lo que falta y luego ve los datos del Zelle
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error ? (
            <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#B91C1C" }}>
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
No se pudo crear el enlace. Cierra esto e inténtalo de nuevo.
            </div>
          ) : !shared ? (
            <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
              Preparando el enlace...
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                Mensaje para enviar
              </p>

              {/* overflowWrap:anywhere — the share URL is one long unbroken
                  string and would otherwise run past the edge of the box. */}
              {/* selectable so it can always be copied by hand as a last resort */}
              <div
                className="rounded-xl p-3 text-sm whitespace-pre-wrap select-all"
                style={{
                  backgroundColor: "var(--admin-filter-bg)",
                  color: "var(--admin-text)",
                  overflowWrap: "anywhere",
                  WebkitUserSelect: "all",
                  userSelect: "all",
                }}
              >
                {message}
              </div>

              {copyFailed && (
                <div
                  className="flex items-start gap-2 p-3 rounded-xl text-sm"
                  style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  Tu navegador bloqueó la copia automática. Mantén presionado el
                  mensaje de arriba para seleccionarlo y cópialo.
                </div>
              )}

              <button
                onClick={() => copy(message, "message")}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white cursor-pointer transition-colors"
                style={{ backgroundColor: "#6B4E3D", minHeight: 44 }}
              >
                {copied === "message" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "message" ? "Copiado" : "Copiar mensaje"}
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--admin-muted)" }}>
                  Solo el enlace
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none min-w-0"
                    style={{
                      border: "1px solid var(--admin-input-border)",
                      backgroundColor: "var(--admin-input)",
                      color: "var(--admin-text)",
                    }}
                  />
                  <button
                    onClick={() => copy(url, "link")}
                    aria-label="Copiar enlace"
                    className="shrink-0 px-3 rounded-xl cursor-pointer"
                    style={{ border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
                  >
                    {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
