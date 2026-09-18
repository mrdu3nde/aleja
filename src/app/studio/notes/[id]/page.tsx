"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Check,
  Undo2,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { NoteStatusBadge } from "@/components/admin/NoteStatusBadge";
import { noteText } from "@/lib/notes";

type Note = {
  id: string;
  imageUrl: string | null;
  imageData: string | null;
  title: string | null;
  transcript: string | null;
  editedText: string | null;
  status: string;
  ocrStatus: string;
  ocrError: string | null;
  createdAt: string;
};

function formatSaved(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-US", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/studio/notes/${id}`);
      if (!res.ok) throw new Error("not_found");
      const { data } = (await res.json()) as { data: Note };
      setNote(data);
      setText(noteText(data));

      // Abrirla ya cuenta como leerla.
      if (data.status === "new") {
        fetch(`/api/studio/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "read" }),
        }).then(() => setNote((n) => (n ? { ...n, status: "read" } : n)));
      }
    } catch {
      setError("No se pudo abrir esta nota.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/studio/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("patch_failed");
    const { data } = await res.json();
    return data as Note;
  }

  async function saveText() {
    if (!text.trim()) {
      setError("Escribe algo antes de guardar.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await patch({ editedText: text });
      setNote((n) => (n ? { ...n, ...updated } : n));
    } catch {
      setError("No se pudo guardar. Intenta otra vez en un momento.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone() {
    setError(null);
    try {
      const next = note?.status === "done" ? "read" : "done";
      const updated = await patch({ status: next });
      setNote((n) => (n ? { ...n, ...updated } : n));
    } catch {
      setError("No se pudo cambiar el estado.");
    }
  }

  async function retryTranscription() {
    setError(null);
    setRetrying(true);
    try {
      const res = await fetch(`/api/studio/notes/${id}/transcribe`, { method: "POST" });
      if (!res.ok) throw new Error("retry_failed");
      const { data } = (await res.json()) as { data: Note };
      setNote((n) => (n ? { ...n, ...data } : n));
      if (data.ocrStatus === "ok" && !note?.editedText) setText(data.transcript ?? "");
    } catch {
      setError("Sigo sin poder leerla. Puedes escribir el texto tú misma.");
    } finally {
      setRetrying(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/studio/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      router.push("/studio/notes");
      router.refresh();
    } catch {
      setError("No se pudo borrar la nota.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={26} className="animate-spin" style={{ color: "#6B4E3D" }} />
      </div>
    );
  }

  if (!note) {
    return (
      <div>
        <Link
          href="/studio/notes"
          className="inline-flex items-center gap-2 text-sm mb-4"
          style={{ color: "var(--admin-muted)", textDecoration: "none" }}
        >
          <ArrowLeft size={16} />
          Mis notas
        </Link>
        <p style={{ color: "var(--admin-text)" }}>{error ?? "Esta nota ya no existe."}</p>
      </div>
    );
  }

  const photo = note.imageUrl ?? note.imageData;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link
        href="/studio/notes"
        className="inline-flex items-center gap-2 text-sm mb-4"
        style={{ color: "var(--admin-muted)", textDecoration: "none" }}
      >
        <ArrowLeft size={16} />
        Mis notas
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          {note.title ?? "Nota sin título"}
        </h1>
        <NoteStatusBadge status={note.status} />
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--admin-muted)" }}>
        Guardada el {formatSaved(note.createdAt)}
      </p>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
          style={{ backgroundColor: "rgba(220,38,38,0.12)", color: "#F87171" }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          {error}
        </div>
      )}

      {note.ocrStatus === "failed" && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: "rgba(245,158,11,0.12)" }}
        >
          <p style={{ fontSize: 14, color: "#F59E0B", marginBottom: 10 }}>
            No pude leer esta nota. Puedes escribirla tú aquí abajo, o intentar de
            nuevo.
          </p>
          <button
            onClick={retryTranscription}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #F59E0B",
              color: "#F59E0B",
              cursor: retrying ? "default" : "pointer",
            }}
          >
            {retrying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {retrying ? "Leyendo…" : "Intentar leerla otra vez"}
          </button>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Aquí aparecerá tu nota…"
        style={{
          width: "100%",
          minHeight: 260,
          borderRadius: 16,
          padding: 16,
          fontSize: 16,
          lineHeight: 1.6,
          backgroundColor: "var(--admin-input)",
          border: "1px solid var(--admin-input-border)",
          color: "var(--admin-text)",
          resize: "vertical",
          outline: "none",
          marginBottom: 12,
        }}
      />

      <div className="flex flex-col gap-3">
        <button
          onClick={saveText}
          disabled={saving}
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 16,
            border: "none",
            backgroundColor: "#6B4E3D",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>

        {photo && (
          <button
            onClick={() => setPhotoOpen(true)}
            className="inline-flex items-center justify-center gap-2"
            style={{
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
            <ImageIcon size={18} />
            Ver la foto original
          </button>
        )}

        <button
          onClick={toggleDone}
          className="inline-flex items-center justify-center gap-2"
          style={{
            width: "100%",
            minHeight: 48,
            borderRadius: 14,
            backgroundColor: "transparent",
            border: "1px solid var(--admin-border)",
            color: note.status === "done" ? "var(--admin-muted)" : "#10B981",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {note.status === "done" ? <Undo2 size={18} /> : <Check size={18} />}
          {note.status === "done" ? "Volver a pendiente" : "Marcar como hecha"}
        </button>

        <button
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center justify-center gap-2"
          style={{
            width: "100%",
            minHeight: 48,
            borderRadius: 14,
            backgroundColor: "transparent",
            border: "1px solid var(--admin-border)",
            color: "#EF4444",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          <Trash2 size={18} />
          Borrar nota
        </button>
      </div>

      {photoOpen && photo && (
        <div
          onClick={() => setPhotoOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            backgroundColor: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            overflow: "auto",
          }}
        >
          <button
            onClick={() => setPhotoOpen(false)}
            aria-label="Cerrar"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 48,
              height: 48,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <X size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt="Tu nota"
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="¿Borrar esta nota?"
        message="Se va la nota y también su foto. Esto no se puede deshacer."
        confirmLabel="Sí, borrar"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
