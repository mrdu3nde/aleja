"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardList, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormField, inputClass, inputStyle } from "@/components/admin/FormField";
import { uploadImage, UploadNotConfiguredError } from "@/lib/upload-image";

/**
 * La ficha técnica de la clienta: lo que se le hizo en cada servicio, para
 * saber qué hacer en la próxima cita. Ella lo pidió con estas partes: fórmula
 * de color, corte o peinado, mapping de mechas, y una foto de antes y otra de
 * después.
 */

export type ServiceRecord = {
  id: string;
  date: string;
  service: string | null;
  formula: string | null;
  cut: string | null;
  mapping: string | null;
  notes: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
};

type Draft = Omit<ServiceRecord, "id">;

const FIELDS = [
  { key: "formula", label: "Fórmula de color", hint: "Marca, tonos, volumen del revelador, tiempo de pose…" },
  { key: "cut", label: "Corte o peinado", hint: "Tipo de corte, largo, capas, peinado final…" },
  { key: "mapping", label: "Mapping de mechas", hint: "Dónde y cómo se pusieron las mechas o flashes…" },
  { key: "notes", label: "Notas para la próxima vez", hint: "Lo que hay que recordar…" },
] as const;

const today = () => new Date().toLocaleDateString("en-CA");

const emptyDraft = (): Draft => ({
  date: today(),
  service: "",
  formula: "",
  cut: "",
  mapping: "",
  notes: "",
  beforeUrl: null,
  afterUrl: null,
});

/** "2026-10-07T12:00:00.000Z" → "7 de octubre de 2026". */
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function ServiceRecords({
  clientId,
  initial,
}: {
  clientId: string;
  initial: ServiceRecord[];
}) {
  const [records, setRecords] = useState(initial);
  // null = cerrado, "new" = ficha nueva, o el id de la que se está editando.
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/studio/services")
      .then((r) => r.json())
      .then((d: { data: { name: string; active: boolean }[] }) =>
        setServices(d.data.filter((s) => s.active).map((s) => s.name)),
      )
      .catch(() => {});
  }, []);

  const save = async (draft: Draft, id: string | null) => {
    const res = await fetch(id ? `/api/studio/records/${id}` : `/api/studio/clients/${clientId}/records`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) return false;
    const saved = (await res.json()) as ServiceRecord;
    setRecords((list) =>
      [...list.filter((r) => r.id !== saved.id), saved].sort((a, b) => b.date.localeCompare(a.date)),
    );
    setEditing(null);
    return true;
  };

  const remove = async (id: string) => {
    setConfirmId(null);
    setRecords((list) => list.filter((r) => r.id !== id));
    await fetch(`/api/studio/records/${id}`, { method: "DELETE" });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
          <ClipboardList className="h-5 w-5" />
          Ficha técnica
          {records.length > 0 && (
            <span className="text-sm font-normal" style={{ color: "var(--admin-muted)" }}>
              {records.length}
            </span>
          )}
        </h2>
        {editing !== "new" && (
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Anotar servicio
          </button>
        )}
      </div>

      {editing === "new" && (
        <RecordForm initial={emptyDraft()} services={services} onSave={(d) => save(d, null)} onCancel={() => setEditing(null)} />
      )}

      {records.length === 0 && editing !== "new" ? (
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
          Todavía no hay servicios anotados. Después de cada cita, anota aquí lo que le hiciste para tenerlo a mano la
          próxima vez.
        </p>
      ) : (
        <div className="space-y-4">
          {records.map((r) =>
            editing === r.id ? (
              <RecordForm
                key={r.id}
                initial={{ ...r, date: r.date.slice(0, 10) }}
                services={services}
                onSave={(d) => save(d, r.id)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <article
                key={r.id}
                className="rounded-2xl p-5"
                style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--admin-text)" }}>
                      {r.service || "Servicio"}
                    </p>
                    <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
                      {longDate(r.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <SmallButton label="Editar" onClick={() => setEditing(r.id)}>
                      <Pencil className="h-4 w-4" />
                    </SmallButton>
                    {confirmId === r.id ? (
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                      >
                        ¿Borrar?
                      </button>
                    ) : (
                      <SmallButton label="Borrar" onClick={() => setConfirmId(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </SmallButton>
                    )}
                  </div>
                </header>

                {(r.beforeUrl || r.afterUrl) && (
                  <div className="mt-4 grid grid-cols-2 gap-3 max-w-md">
                    <PhotoView url={r.beforeUrl} label="Antes" />
                    <PhotoView url={r.afterUrl} label="Después" />
                  </div>
                )}

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {FIELDS.filter((f) => r[f.key]).map((f) => (
                    <div key={f.key}>
                      <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                        {f.label}
                      </dt>
                      <dd className="mt-1 text-sm whitespace-pre-wrap" style={{ color: "var(--admin-text)" }}>
                        {r[f.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function RecordForm({
  initial,
  services,
  onSave,
  onCancel,
}: {
  initial: Draft;
  services: string[];
  onSave: (draft: Draft) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    if (!(await onSave(draft))) setError("No se pudo guardar. Inténtalo de nuevo.");
    setSaving(false);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl p-5 mb-4 space-y-4"
      style={{ backgroundColor: "var(--admin-card)", border: "1px solid #C2A26B" }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Fecha">
          <input
            type="date"
            required
            value={draft.date}
            onChange={(e) => set({ date: e.target.value })}
            className={inputClass}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Servicio">
          <input
            list="record-services"
            value={draft.service ?? ""}
            onChange={(e) => set({ service: e.target.value })}
            placeholder="Balayage, corte, blowout…"
            className={inputClass}
            style={inputStyle}
          />
          <datalist id="record-services">
            {services.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <PhotoSlot label="Antes" url={draft.beforeUrl} onChange={(beforeUrl) => set({ beforeUrl })} onError={setError} />
        <PhotoSlot label="Después" url={draft.afterUrl} onChange={(afterUrl) => set({ afterUrl })} onError={setError} />
      </div>

      {FIELDS.map((f) => (
        <FormField key={f.key} label={f.label}>
          <textarea
            rows={2}
            value={draft[f.key] ?? ""}
            onChange={(e) => set({ [f.key]: e.target.value })}
            placeholder={f.hint}
            className={inputClass}
            style={inputStyle}
          />
        </FormField>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#6B4E3D] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-6 py-2.5 text-sm font-medium cursor-pointer"
          style={{ color: "var(--admin-text)", backgroundColor: "var(--admin-hover)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Un hueco para una foto: toca para subirla, la X la quita. */
function PhotoSlot({
  label,
  url,
  onChange,
  onError,
}: {
  label: string;
  url: string | null;
  onChange: (url: string | null) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(`records/${file.name}`, file));
    } catch (err) {
      onError(
        err instanceof UploadNotConfiguredError
          ? "El almacenamiento de fotos aún no está conectado."
          : "No se pudo subir la foto. Prueba con una más pequeña (máx. 8 MB).",
      );
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--admin-muted)" }}>
        {label}
      </p>
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Quitar foto de ${label.toLowerCase()}`}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="h-full w-full flex flex-col items-center justify-center gap-2 text-xs cursor-pointer"
            style={{ border: "2px dashed var(--admin-input-border)", borderRadius: 12, color: "var(--admin-muted)" }}
          >
            <ImagePlus className="h-6 w-6" />
            {busy ? "Subiendo…" : "Subir foto"}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}

function PhotoView({ url, label }: { url: string | null; label: string }) {
  return (
    <figure>
      <figcaption className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--admin-muted)" }}>
        {label}
      </figcaption>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block aspect-[4/5] rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="h-full w-full object-cover" />
        </a>
      ) : (
        <div
          className="aspect-[4/5] rounded-xl flex items-center justify-center text-xs"
          style={{ backgroundColor: "var(--admin-hover)", color: "var(--admin-muted)" }}
        >
          Sin foto
        </div>
      )}
    </figure>
  );
}

function SmallButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-lg p-2 cursor-pointer"
      style={{ color: "var(--admin-muted)", backgroundColor: "var(--admin-hover)" }}
    >
      {children}
    </button>
  );
}
