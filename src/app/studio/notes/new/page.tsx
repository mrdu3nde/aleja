"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  ImagePlus,
  X,
  Send,
  Keyboard,
} from "lucide-react";
import { VoiceRecorder } from "@/components/admin/VoiceRecorder";
import { shrinkImage } from "@/lib/audio";

const card = {
  backgroundColor: "var(--admin-card)",
  border: "1px solid var(--admin-border)",
};

const ERRORS: Record<string, string> = {
  sin_voz: "No se oyó nada en la grabación. Inténtalo otra vez, más cerca del micrófono.",
  sin_configurar: "La transcripción no está conectada. Escribe la nota por ahora.",
  transcripcion_fallo:
    "Los modelos están saturados en este momento. Vuelve a intentarlo, o escríbela.",
  invalid_body: "Esa nota no se pudo guardar. Puede ser demasiado larga.",
};

export default function NewNotePage() {
  const [audio, setAudio] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [writing, setWriting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const send = async (payload: { audio?: string; text?: string }) => {
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/studio/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, imageData: photo ?? undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(ERRORS[data.error] ?? "No se pudo guardar la nota.");
        setSending(false);
        return;
      }

      const { data } = await res.json();
      router.push(`/studio/notes/${data.id}`);
    } catch {
      setError("Se perdió la conexión. La grabación sigue aquí: vuelve a intentarlo.");
      setSending(false);
    }
  };

  // La grabación se guarda en el estado antes de mandarla, a propósito: si el
  // modelo falla, ella no pierde lo que dijo y puede reintentar.
  const onRecorded = (dataUrl: string) => {
    setAudio(dataUrl);
    send({ audio: dataUrl });
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      setPhoto(await shrinkImage(file));
    } catch {
      setError("No se pudo leer esa imagen.");
    }
  };

  if (sending) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="rounded-2xl p-8 text-center" style={card}>
          <Loader2
            className="h-8 w-8 animate-spin mx-auto mb-4"
            style={{ color: "var(--admin-muted)" }}
          />
          <p className="font-medium" style={{ color: "var(--admin-text)" }}>
            Pasando tu voz a texto...
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
            Tarda unos segundos. No cierres la pantalla.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <Link
        href="/studio/notes"
        className="inline-flex items-center gap-2 text-sm mb-4"
        style={{ color: "var(--admin-muted)", textDecoration: "none" }}
      >
        <ArrowLeft size={16} />
        Mejoras
      </Link>

      <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
        Pedir una mejora
      </h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "var(--admin-muted)" }}>
        Cuenta con tus palabras qué quieres que cambie en la plataforma. No hace
        falta que sea ordenado — habla como si me lo estuvieras explicando.
      </p>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            {error}
            {audio && (
              <button
                onClick={() => send({ audio })}
                className="block mt-2 underline cursor-pointer"
              >
                Reintentar con la misma grabación
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5 mb-5" style={card}>
        {writing ? (
          <>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--admin-text)" }}
            >
              Escribe lo que quieres cambiar
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              autoFocus
              placeholder="Por ejemplo: quiero que las clientas puedan cancelar su cita desde el enlace que les mando."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-y"
              style={{
                backgroundColor: "var(--admin-input)",
                border: "1px solid var(--admin-input-border)",
                color: "var(--admin-text)",
              }}
            />
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                onClick={() => send({ text })}
                disabled={!text.trim()}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: "#6B4E3D", color: "#ffffff" }}
              >
                <Send className="h-4 w-4" />
                Guardar
              </button>
              <button
                onClick={() => setWriting(false)}
                className="text-sm underline cursor-pointer"
                style={{ color: "var(--admin-muted)" }}
              >
                Mejor lo dicto
              </button>
            </div>
          </>
        ) : (
          <>
            <VoiceRecorder onRecorded={onRecorded} label="Grabar lo que quiero" />
            <button
              onClick={() => setWriting(true)}
              className="flex items-center gap-2 text-sm underline mt-4 cursor-pointer"
              style={{ color: "var(--admin-muted)" }}
            >
              <Keyboard className="h-4 w-4" />
              Prefiero escribirlo
            </button>
          </>
        )}
      </div>

      <div className="rounded-2xl p-5" style={card}>
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
          Adjuntar una foto (opcional)
        </h2>
        <p className="text-sm mb-3" style={{ color: "var(--admin-muted)" }}>
          Si te sirve mostrarme algo —un papel, una captura de pantalla, un
          ejemplo que te gustó— súbela aquí. No hace falta: la foto es solo para
          mirarla, lo que vale es lo que dictes.
        </p>

        {photo ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Foto adjunta"
              className="h-20 w-20 rounded-xl object-cover"
              style={{ border: "1px solid var(--admin-border)" }}
            />
            <button
              onClick={() => setPhoto(null)}
              className="flex items-center gap-1.5 text-sm underline cursor-pointer"
              style={{ color: "#b91c1c" }}
            >
              <X className="h-4 w-4" />
              Quitar
            </button>
          </div>
        ) : (
          <label
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm cursor-pointer"
            style={{ border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
          >
            <ImagePlus className="h-4 w-4" />
            Subir una foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </label>
        )}
      </div>
    </div>
  );
}
