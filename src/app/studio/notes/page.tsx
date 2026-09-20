"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, Sparkles, Loader2, Keyboard, MessageCircleQuestion } from "lucide-react";
import { NoteStatusBadge } from "@/components/admin/NoteStatusBadge";
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

      <Link
        href="/studio/notes/new"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          minHeight: 60,
          borderRadius: 18,
          background: "linear-gradient(135deg, #6B4E3D, #553D2F)",
          color: "#fff",
          fontSize: 16,
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        <Mic size={22} />
        Pedir una mejora
      </Link>

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
              ? "Toca el botón de arriba y cuéntame qué te gustaría cambiar."
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
