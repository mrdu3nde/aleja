"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Camera, ImagePlus, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { resizeImage } from "@/lib/image-resize";

type Note = {
  id: string;
  transcript: string | null;
  ocrStatus: string;
  ocrError: string | null;
};

type Phase = "idle" | "uploading" | "reading" | "editing" | "saving";

const PHASE_LABEL: Record<string, string> = {
  uploading: "Guardando tu foto…",
  reading: "Leyendo tu nota…",
  saving: "Guardando…",
};

export function NoteCapture() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setWarning(null);
    setPhase("uploading");

    try {
      // Reducir primero: arregla el peso, el HEIC del iPhone y la velocidad.
      const { dataUrl, blob } = await resizeImage(file);
      setPreview(dataUrl);

      // Se intenta Blob y, si no está conectado, la foto viaja con la nota.
      let imageUrl: string | undefined;
      try {
        const uploaded = await upload(`notes/${Date.now()}.jpg`, blob, {
          access: "public",
          handleUploadUrl: "/api/studio/upload",
        });
        imageUrl = uploaded.url;
      } catch {
        imageUrl = undefined;
      }

      setPhase("reading");

      const res = await fetch("/api/studio/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageUrl ? { imageUrl } : { imageData: dataUrl }),
      });

      if (!res.ok) {
        setError(
          res.status === 400
            ? "Esa foto pesa mucho. Vuelve a tomarla desde la cámara."
            : "No se pudo guardar. Intenta otra vez en un momento.",
        );
        setPhase("idle");
        return;
      }

      const { data } = (await res.json()) as { data: Note };
      setNote(data);
      setText(data.transcript ?? "");
      if (data.ocrStatus !== "ok") {
        setWarning(
          "No pude leer esta nota. Puedes escribirla tú aquí abajo, o tomar otra foto con mejor luz.",
        );
      }
      setPhase("editing");
    } catch {
      setError(
        navigator.onLine === false
          ? "Parece que no hay internet. Revisa tu señal y vuelve a intentar."
          : "No se pudo subir la foto. Intenta con otra o vuelve a tomarla.",
      );
      setPhase("idle");
    }
  }

  async function save() {
    if (!note || !text.trim()) {
      setError("Escribe algo antes de guardar.");
      return;
    }
    setError(null);
    setPhase("saving");
    try {
      const res = await fetch(`/api/studio/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedText: text }),
      });
      if (!res.ok) throw new Error("save_failed");
      router.push("/studio/notes");
      router.refresh();
    } catch {
      setError("No se pudo guardar. Intenta otra vez en un momento.");
      setPhase("editing");
    }
  }

  function reset() {
    setPreview(null);
    setNote(null);
    setText("");
    setError(null);
    setWarning(null);
    setPhase("idle");
  }

  const busy = phase === "uploading" || phase === "reading" || phase === "saving";

  return (
    <div style={{ maxWidth: 560 }}>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        // Abre la cámara trasera directamente en el celular.
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
          style={{ backgroundColor: "rgba(220,38,38,0.12)", color: "#F87171" }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          {error}
        </div>
      )}

      {preview && (
        <div style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Tu nota"
            style={{ width: "100%", borderRadius: 16, display: "block" }}
          />
          {!busy && (
            <button
              onClick={reset}
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                minHeight: 48,
                borderRadius: 14,
                backgroundColor: "transparent",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={18} />
              Repetir la foto
            </button>
          )}
        </div>
      )}

      {busy && (
        <div
          className="flex items-center gap-3 rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <Loader2 size={22} className="animate-spin" style={{ color: "#6B4E3D" }} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text)" }}>
              {PHASE_LABEL[phase]}
            </p>
            {phase === "reading" && (
              <p style={{ fontSize: 13, color: "var(--admin-muted)", marginTop: 2 }}>
                Esto tarda unos segundos. No cierres la pantalla.
              </p>
            )}
          </div>
        </div>
      )}

      {phase === "idle" && (
        <>
          <button
            onClick={() => cameraRef.current?.click()}
            style={{
              width: "100%",
              minHeight: 180,
              borderRadius: 24,
              border: "none",
              background: "linear-gradient(135deg, #6B4E3D, #553D2F)",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
            }}
          >
            <Camera size={44} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>Tomar foto de mi nota</span>
          </button>
          <p
            style={{
              fontSize: 13,
              color: "var(--admin-muted)",
              textAlign: "center",
              margin: "12px 0 16px",
            }}
          >
            Se abre la cámara. Acerca el papel y que se vea bien la luz.
          </p>
          <button
            onClick={() => galleryRef.current?.click()}
            style={{
              width: "100%",
              minHeight: 56,
              borderRadius: 16,
              backgroundColor: "transparent",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <ImagePlus size={20} />
            Elegir una foto que ya tomé
          </button>
        </>
      )}

      {(phase === "editing" || phase === "saving") && (
        <>
          {warning && (
            <div
              className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
              style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              {warning}
            </div>
          )}

          <p style={{ fontSize: 15, color: "var(--admin-text)", marginBottom: 8 }}>
            Esto fue lo que leí. Revísalo y cámbialo si hace falta.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Aquí aparecerá tu nota…"
            style={{
              width: "100%",
              minHeight: 240,
              borderRadius: 16,
              padding: 16,
              // 16px justos: por debajo, iOS hace zoom al enfocar el campo.
              fontSize: 16,
              lineHeight: 1.6,
              backgroundColor: "var(--admin-input)",
              border: "1px solid var(--admin-input-border)",
              color: "var(--admin-text)",
              resize: "vertical",
              outline: "none",
            }}
          />

          <div
            style={{
              position: "sticky",
              bottom: 0,
              marginTop: 16,
              paddingTop: 12,
              paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
              backgroundColor: "var(--admin-card)",
              borderTop: "1px solid var(--admin-border)",
            }}
          >
            <button
              onClick={save}
              disabled={phase === "saving"}
              style={{
                width: "100%",
                minHeight: 56,
                borderRadius: 16,
                border: "none",
                backgroundColor: "#6B4E3D",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: phase === "saving" ? "default" : "pointer",
                opacity: phase === "saving" ? 0.6 : 1,
              }}
            >
              {phase === "saving" ? "Guardando…" : "Guardar nota"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
