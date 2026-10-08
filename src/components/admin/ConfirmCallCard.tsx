"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Volume2 } from "lucide-react";
import { CALL_REPLY, CALL_RESULT_LABEL, digitResult, type CallResult } from "@/lib/call-script";

/**
 * "Llamada de confirmación" en la página de una cita.
 *
 * Es una DEMOSTRACIÓN del módulo de llamadas de conasupo: el teléfono de la
 * pantalla "llama", la voz del navegador lee el guion que oiría la clienta, y
 * ella marca 1, 2 o 9 como lo haría su clienta. No se llama a nadie y la cita
 * no cambia. Con un número de Twilio, el mismo botón haría la llamada real.
 */

export type AppointmentCall = {
  id: string;
  mode: string;
  status: string;
  result: string | null;
  createdAt: string;
};

type Phase = "ringing" | "talking" | "waiting" | "done";

export function ConfirmCallCard({
  appointmentId,
  clientName,
  disabled,
  calls,
  onChanged,
}: {
  appointmentId: string;
  clientName: string;
  disabled: boolean;
  calls: AppointmentCall[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const last = calls[0];

  return (
    <div
      data-tour="llamar"
      className="rounded-2xl p-5"
      style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
    >
      <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
        <Phone className="h-5 w-5" />
        Llamada de confirmación
        <span
          className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: "#E6D3AC", color: "#3A2E26" }}
        >
          Demo
        </span>
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--admin-muted)" }}>
        Una voz llama a tu clienta y le pide marcar 1 para confirmar o 2 si no puede venir. Esto es una
        demostración: la escuchas aquí y no se llama a nadie.
      </p>

      {last && (
        <p className="text-sm mb-4" style={{ color: "var(--admin-text)" }}>
          Última prueba:{" "}
          <strong>
            {last.result ? CALL_RESULT_LABEL[last.result as CallResult] : "Colgó sin marcar"}
          </strong>{" "}
          <span style={{ color: "var(--admin-muted)" }}>
            · {new Date(last.createdAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </p>
      )}

      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Phone className="h-4 w-4" />
        Probar llamada
      </button>
      {disabled && (
        <p className="mt-2 text-xs" style={{ color: "var(--admin-muted)" }}>
          La cita está cancelada.
        </p>
      )}

      {open && (
        <CallSimulator
          appointmentId={appointmentId}
          clientName={clientName}
          onClose={() => {
            setOpen(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

/** Lee una frase con la voz en español del navegador (si la hay). */
function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // Sin voz: se deja un momento para leer en pantalla.
      setTimeout(resolve, 1800);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-US";
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("es") && /female|mujer|paulina|monica|sabina|helena|google español/i.test(v.name))
      ?? window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("es"));
    if (voice) u.voice = voice;
    u.rate = 0.98;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

function CallSimulator({
  appointmentId,
  clientName,
  onClose,
}: {
  appointmentId: string;
  clientName: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("ringing");
  const [script, setScript] = useState<string[]>([]);
  const [line, setLine] = useState(-1);
  const [phone, setPhone] = useState<string | null>(null);
  const [result, setResult] = useState<CallResult | null>(null);
  const [error, setError] = useState("");
  const callId = useRef<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    (async () => {
      const res = await fetch(`/api/studio/appointments/${appointmentId}/call`, { method: "POST" });
      if (!res.ok) {
        setError("No se pudo iniciar la prueba.");
        return;
      }
      const d = (await res.json()) as { callId: string; script: string[]; phone: string | null };
      callId.current = d.callId;
      setScript(d.script);
      setPhone(d.phone);
      // Unos segundos sonando, como una llamada de verdad.
      await new Promise((r) => setTimeout(r, 2200));
      if (!alive.current) return;
      setPhase("talking");
      for (let i = 0; i < d.script.length; i++) {
        if (!alive.current) return;
        setLine(i);
        await speak(d.script[i]);
      }
      if (alive.current) setPhase("waiting");
    })();
    return () => {
      alive.current = false;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [appointmentId]);

  const finish = async (digit?: string) => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const r = digit ? digitResult(digit) : null;
    setResult(r);
    setPhase("done");
    if (callId.current) {
      await fetch(`/api/studio/calls/${callId.current}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digit }),
      });
    }
    if (r) await speak(CALL_REPLY[r]);
  };

  const hangUp = () => {
    if (phase !== "done") void finish();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Prueba de llamada"
      className="fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: "rgba(20,14,10,0.6)" }}
    >
      {/* Un teléfono: así se entiende de un vistazo qué vería y oiría la clienta. */}
      <div
        className="w-full max-w-sm max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[32px] p-6 text-white"
        style={{ background: "linear-gradient(180deg, #3A2E26 0%, #241b16 100%)", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}
      >
        <p className="text-center text-[11px] uppercase tracking-[0.25em]" style={{ color: "#E6D3AC" }}>
          Demostración · no se llama a nadie
        </p>
        <div className="mt-5 flex flex-col items-center text-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${phase === "ringing" ? "animate-pulse" : ""}`}
            style={{ backgroundColor: "rgba(230,211,172,0.15)", border: "1px solid rgba(230,211,172,0.4)" }}
          >
            <Phone className="h-8 w-8" style={{ color: "#E6D3AC" }} />
          </div>
          <p className="mt-4 text-xl font-semibold">{clientName}</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {phone ?? "sin teléfono guardado"}
          </p>
          <p className="mt-2 text-sm" style={{ color: "#E6D3AC" }}>
            {error ||
              (phase === "ringing"
                ? "Llamando…"
                : phase === "talking"
                  ? "En llamada — la voz está hablando"
                  : phase === "waiting"
                    ? "Esperando a que marque…"
                    : "Llamada terminada")}
          </p>
        </div>

        {/* Lo que dice la voz, frase por frase. */}
        {script.length > 0 && phase !== "ringing" && (
          <div className="mt-5 space-y-1.5 rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Volume2 className="h-3.5 w-3.5" /> Lo que escucha tu clienta
            </p>
            {script.map((s, i) => (
              <p key={i} style={{ color: i === line && phase === "talking" ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: i === line && phase === "talking" ? 600 : 400 }}>
                {s}
              </p>
            ))}
            {result && <p className="pt-2 font-semibold" style={{ color: "#E6D3AC" }}>{CALL_REPLY[result]}</p>}
          </div>
        )}

        {phase === "done" ? (
          <div className="mt-5 rounded-2xl p-4 text-center text-sm" style={{ backgroundColor: "rgba(230,211,172,0.12)" }}>
            <p className="font-semibold" style={{ color: "#E6D3AC" }}>
              {result ? CALL_RESULT_LABEL[result] : "Colgó sin marcar"}
            </p>
            <p className="mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              {result === "confirmed"
                ? "Con la llamada real, la cita quedaría confirmada sola."
                : result === "declined"
                  ? "Con la llamada real, te avisaríamos para darle otro horario."
                  : "Con la llamada real, se volvería a intentar más tarde."}
            </p>
          </div>
        ) : (
          <>
            <p className="mt-5 text-center text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              Marca como lo haría tu clienta:
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                { d: "1", label: "Confirmo" },
                { d: "2", label: "No puedo" },
                { d: "9", label: "No llamar" },
              ].map((k) => (
                <button
                  key={k.d}
                  onClick={() => finish(k.d)}
                  disabled={phase === "ringing" || !!error}
                  className="flex flex-col items-center rounded-2xl py-3 cursor-pointer disabled:opacity-40"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <span className="text-2xl font-semibold">{k.d}</span>
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>{k.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={hangUp}
            aria-label={phase === "done" ? "Cerrar" : "Colgar"}
            className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold cursor-pointer"
            style={{ backgroundColor: phase === "done" ? "#6B4E3D" : "#dc2626" }}
          >
            <PhoneOff className="h-4 w-4" />
            {phase === "done" ? "Cerrar" : "Colgar"}
          </button>
        </div>
      </div>
    </div>
  );
}
