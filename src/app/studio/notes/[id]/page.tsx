"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Pencil,
  Save,
  ImagePlus,
  X,
  Send,
  Keyboard,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";
import { NoteStatusBadge } from "@/components/admin/NoteStatusBadge";
import { VoiceRecorder } from "@/components/admin/VoiceRecorder";
import { MESSAGE_AUTHOR_LABELS, noteText } from "@/lib/notes";
import { shrinkImage } from "@/lib/audio";

type Message = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type Note = {
  id: string;
  title: string | null;
  transcript: string | null;
  editedText: string | null;
  source: string;
  status: string;
  aiStatus: string;
  aiError: string | null;
  imageUrl: string | null;
  imageData: string | null;
  resolvedAt: string | null;
  createdAt: string;
  messages: Message[];
};

const card = {
  backgroundColor: "var(--admin-card)",
  border: "1px solid var(--admin-border)",
};

const ERRORS: Record<string, string> = {
  sin_voz: "No se oyó nada. Inténtalo otra vez, más cerca del micrófono.",
  sin_configurar: "La transcripción no está conectada. Escribe tu respuesta.",
  transcripcion_fallo: "Los modelos están saturados. Vuelve a intentarlo, o escríbela.",
};

function fullDate(value: string) {
  return new Date(value).toLocaleString("es", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [note, setNote] = useState<Note | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyWriting, setReplyWriting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/studio/notes/${id}`);
      if (!res.ok) {
        setLoadError(
          res.status === 404
            ? "Esta nota ya no existe."
            : res.status === 401
              ? "Tu sesión venció. Vuelve a entrar."
              : "No se pudo cargar la nota.",
        );
        return;
      }
      const { data } = await res.json();
      setNote(data);
    } catch {
      setLoadError("No se pudo cargar la nota.");
    }
  }, [id]);

  useEffect(() => {
    fetch(`/api/studio/notes/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ data }) => setNote(data))
      .catch((status) =>
        setLoadError(
          status === 404
            ? "Esta nota ya no existe."
            : status === 401
              ? "Tu sesión venció. Vuelve a entrar."
              : "No se pudo cargar la nota.",
        ),
      );
  }, [id]);

  const patch = async (body: Record<string, unknown>, okMessage?: string) => {
    setError("");
    setSaved("");
    setBusy(true);
    try {
      const res = await fetch(`/api/studio/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("No se pudo guardar el cambio.");
        return;
      }
      if (okMessage) setSaved(okMessage);
      await load();
    } catch {
      setError("No se pudo guardar el cambio.");
    } finally {
      setBusy(false);
    }
  };

  const reply = async (payload: { audio?: string; text?: string }) => {
    setError("");
    setSaved("");
    setBusy(true);
    try {
      const res = await fetch(`/api/studio/notes/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(ERRORS[data.error] ?? "No se pudo enviar tu respuesta.");
        return;
      }
      setReplyText("");
      setReplyWriting(false);
      setSaved("Respuesta enviada.");
      await load();
    } catch {
      setError("No se pudo enviar tu respuesta.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/studio/notes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("No se pudo borrar.");
        setBusy(false);
        return;
      }
      router.push("/studio/notes");
    } catch {
      setError("No se pudo borrar.");
      setBusy(false);
    }
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      await patch({ imageData: await shrinkImage(file) }, "Foto adjuntada.");
    } catch {
      setError("No se pudo leer esa imagen.");
    }
  };

  if (loadError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
        <Link
          href="/studio/notes"
          className="inline-flex items-center gap-2 text-sm mt-4"
          style={{ color: "var(--admin-muted)", textDecoration: "none" }}
        >
          <ArrowLeft size={16} />
          Volver a las mejoras
        </Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={26} className="animate-spin" style={{ color: "#6B4E3D" }} />
      </div>
    );
  }

  const photo = note.imageUrl ?? note.imageData;
  const text = noteText(note);

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

      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          {note.title ?? "Sin título"}
        </h1>
        <NoteStatusBadge status={note.status} />
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--admin-muted)" }}>
        {note.source === "text" ? "Escrita" : "Dictada"} el {fullDate(note.createdAt)}
        {note.resolvedAt && ` · resuelta el ${fullDate(note.resolvedAt)}`}
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-4">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {saved}
        </div>
      )}

      {note.status === "done" && (
        <div
          className="flex items-start gap-2 rounded-xl p-4 text-sm mb-5"
          style={{ backgroundColor: "#10B98118", color: "var(--admin-text)" }}
        >
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#10B981" }} />
          <span>Esto ya está hecho y publicado en la plataforma.</span>
        </div>
      )}

      {/* Lo que pidió */}
      <div className="rounded-2xl p-5 mb-5" style={card}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            Lo que pediste
          </h2>
          {!editing && (
            <button
              onClick={() => {
                setDraft(text);
                setEditing(true);
              }}
              className="flex items-center gap-1.5 text-sm underline cursor-pointer"
              style={{ color: "var(--admin-muted)" }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Corregir
            </button>
          )}
        </div>

        {editing ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={7}
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-y"
              style={{
                backgroundColor: "var(--admin-input)",
                border: "1px solid var(--admin-input-border)",
                color: "var(--admin-text)",
              }}
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={async () => {
                  await patch({ editedText: draft }, "Corrección guardada.");
                  setEditing(false);
                }}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: "#6B4E3D", color: "#ffffff" }}
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm underline cursor-pointer"
                style={{ color: "var(--admin-muted)" }}
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <p
            className="text-sm whitespace-pre-wrap"
            style={{ color: "var(--admin-text)", lineHeight: 1.6 }}
          >
            {text || "Sin texto."}
          </p>
        )}

        {note.editedText?.trim() && note.transcript?.trim() && !editing && (
          <details className="mt-4">
            <summary
              className="text-xs cursor-pointer"
              style={{ color: "var(--admin-muted)" }}
            >
              Ver lo que se oyó antes de tu corrección
            </summary>
            <p
              className="text-xs whitespace-pre-wrap mt-2"
              style={{ color: "var(--admin-muted)", lineHeight: 1.6 }}
            >
              {note.transcript}
            </p>
          </details>
        )}
      </div>

      {/* Foto de respaldo */}
      <div className="rounded-2xl p-5 mb-5" style={card}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
          Foto adjunta
        </h2>
        {photo ? (
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Foto adjunta a la nota"
              className="rounded-xl max-w-full"
              style={{ maxHeight: 360, border: "1px solid var(--admin-border)" }}
            />
            <button
              onClick={() => patch({ imageData: null, imageUrl: null }, "Foto quitada.")}
              disabled={busy}
              aria-label="Quitar la foto"
              className="shrink-0 rounded-lg p-2 cursor-pointer"
              style={{ color: "#b91c1c" }}
            >
              <X className="h-4 w-4" />
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

      {/* Conversación */}
      <div className="rounded-2xl p-5 mb-5" style={card}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--admin-text)" }}>
          Conversación
        </h2>

        {note.messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
            Nada todavía. Si algo de tu pedido no me queda claro, te dejaré la
            pregunta aquí.
          </p>
        ) : (
          <ul className="space-y-4 mb-5">
            {note.messages.map((message) => {
              const mine = message.author === "claude";
              return (
                <li
                  key={message.id}
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: mine ? "#6B4E3D14" : "var(--admin-filter-bg)",
                    borderLeft: `3px solid ${mine ? "#6B4E3D" : "var(--admin-border)"}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {mine && (
                      <MessageCircleQuestion
                        className="h-3.5 w-3.5"
                        style={{ color: "#6B4E3D" }}
                      />
                    )}
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {MESSAGE_AUTHOR_LABELS[message.author] ?? message.author}
                    </span>
                    <span className="text-xs" style={{ color: "var(--admin-muted)" }}>
                      {fullDate(message.createdAt)}
                    </span>
                  </div>
                  <p
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: "var(--admin-text)", lineHeight: 1.6 }}
                  >
                    {message.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {replyWriting ? (
          <>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Escribe tu respuesta"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-y"
              style={{
                backgroundColor: "var(--admin-input)",
                border: "1px solid var(--admin-input-border)",
                color: "var(--admin-text)",
              }}
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => reply({ text: replyText })}
                disabled={busy || !replyText.trim()}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: "#6B4E3D", color: "#ffffff" }}
              >
                <Send className="h-4 w-4" />
                Enviar
              </button>
              <button
                onClick={() => setReplyWriting(false)}
                className="text-sm underline cursor-pointer"
                style={{ color: "var(--admin-muted)" }}
              >
                Mejor lo dicto
              </button>
            </div>
          </>
        ) : busy ? (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "var(--admin-muted)" }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Un momento...
          </div>
        ) : (
          <>
            <VoiceRecorder
              onRecorded={(audio) => reply({ audio })}
              label="Contestar hablando"
            />
            <button
              onClick={() => setReplyWriting(true)}
              className="flex items-center gap-2 text-sm underline mt-3 cursor-pointer"
              style={{ color: "var(--admin-muted)" }}
            >
              <Keyboard className="h-4 w-4" />
              Prefiero escribir
            </button>
          </>
        )}
      </div>

      {/* Borrar */}
      <div className="rounded-2xl p-5" style={card}>
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm" style={{ color: "var(--admin-text)" }}>
              ¿Seguro que quieres borrarla? No se puede deshacer.
            </span>
            <button
              onClick={remove}
              disabled={busy}
              className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: "#DC2626", color: "#ffffff" }}
            >
              Sí, borrar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm underline cursor-pointer"
              style={{ color: "var(--admin-muted)" }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-sm cursor-pointer"
            style={{ color: "#b91c1c", background: "none", border: "none" }}
          >
            <Trash2 className="h-4 w-4" />
            Borrar esta nota
          </button>
        )}
      </div>
    </div>
  );
}
