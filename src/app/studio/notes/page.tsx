"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  Sparkles,
  Loader2,
  Keyboard,
  MessageCircleQuestion,
  AlertCircle,
} from "lucide-react";
import { NoteStatusBadge } from "@/components/admin/NoteStatusBadge";
import { VoiceRecorder } from "@/components/admin/VoiceRecorder";
import { noteText } from "@/lib/notes";

type Note = {
  id: string;
  title: string | null;
  transcript: string | null;
  editedText: string | null;
  source: string;
  status: string;
  aiStatus: string;
  imageUrl: string | null;
  createdAt: string;
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "new", label: "Nuevas" },
  { key: "needs_info", label: "Falta info" },
  { key: "done", label: "Resueltas" },
] as const;

const ERRORS: Record<string, string> = {
  sin_voz: "No se oyó nada. Inténtalo otra vez, más cerca del micrófono.",
  sin_configurar: "La transcripción no está conectada todavía. Puedes escribirla.",
  transcripcion_fallo: "Los modelos están saturados. Vuelve a intentarlo, o escríbela.",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Se graba y se guarda desde aquí mismo. Antes había que entrar a otra
  // pantalla y tocar un segundo botón para empezar: dos pasos que no aportaban
  // nada, y un botón que decía "pedir una mejora" mientras mostraba un
  // micrófono, así que no se entendía qué iba a pasar al tocarlo.
  const saveRecording = async (audio: string) => {
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/studio/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(ERRORS[data.error] ?? "No se pudo guardar.");
        setSending(false);
        return;
      }
      const { data } = await res.json();
      router.push(`/studio/notes/${data.id}`);
    } catch {
      setError("Se perdió la conexión. Vuelve a intentarlo.");
      setSending(false);
    }
  };

  useEffect(() => {
    // El "cargando" lo enciende el botón del filtro, no este efecto:
    // un setState síncrono aquí dispara renders en cascada.
    let cancelled = false;
    const query = filter === "all" ? "" : `?status=${filter}`;
    fetch(`/api/studio/notes${query}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) setNotes(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          Mejoras
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
          Lo que quieres que cambie en la plataforma. Lo dictas aquí y yo lo
          implemento; cuando quede hecho lo verás marcado como resuelto.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        {sending ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              width: "100%",
              minHeight: 76,
              borderRadius: 18,
              background: "var(--admin-filter-bg)",
              color: "var(--admin-text)",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            <Loader2 size={20} className="animate-spin" />
            Pasando tu voz a texto...
          </div>
        ) : (
          <VoiceRecorder variant="big" label="Toca y cuéntame" onRecorded={saveRecording} />
        )}

        <div className="flex justify-center mt-3">
          <Link
            href="/studio/notes/new"
            className="inline-flex items-center gap-1.5 text-sm underline"
            style={{ color: "var(--admin-muted)" }}
          >
            <Keyboard size={14} />
            Prefiero escribirlo
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => {
                if (f.key === filter) return;
                setLoading(true);
                setFilter(f.key);
              }}
              className="rounded-full px-4 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: active ? "#6B4E3D" : "var(--admin-filter-bg)",
                color: active ? "#fff" : "var(--admin-text)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={26} className="animate-spin" style={{ color: "#6B4E3D" }} />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-14">
          <Sparkles
            size={44}
            style={{ color: "var(--admin-border)", margin: "0 auto 14px" }}
          />
          <p style={{ fontSize: 16, color: "var(--admin-text)", marginBottom: 6 }}>
            {filter === "all"
              ? "Todavía no has pedido nada."
              : "Nada por aquí con ese filtro."}
          </p>
          <p style={{ fontSize: 14, color: "var(--admin-muted)" }}>
            {filter === "all"
              ? "Toca el botón de arriba y dime qué te gustaría cambiar."
              : "Prueba con otro filtro."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/studio/notes/${note.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                minHeight: 88,
                padding: 14,
                borderRadius: 16,
                backgroundColor: "var(--admin-card)",
                border: "1px solid var(--admin-border)",
                textDecoration: "none",
              }}
            >
              <div
                className="rounded-xl flex items-center justify-center"
                style={{
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  backgroundColor:
                    note.status === "needs_info" ? "#DC262622" : "var(--admin-hover)",
                }}
              >
                {note.status === "needs_info" ? (
                  <MessageCircleQuestion size={20} style={{ color: "#DC2626" }} />
                ) : note.source === "text" ? (
                  <Keyboard size={20} style={{ color: "var(--admin-muted)" }} />
                ) : (
                  <Mic size={20} style={{ color: "var(--admin-muted)" }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--admin-text)" }}
                  >
                    {note.title ?? "Sin título"}
                  </p>
                  <NoteStatusBadge status={note.status} />
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--admin-muted)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {note.status === "needs_info"
                    ? "Te dejé una pregunta. Ábrela para contestarme."
                    : noteText(note) || "Sin texto"}
                </p>
                <p style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 4 }}>
                  {timeAgo(note.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
