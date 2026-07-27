"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  ChevronRight,
  Plus,
  Trash2,
  ImagePlus,
  Loader2,
  AlertCircle,
  EyeOff,
  Eye,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { humanDuration } from "@/lib/time";

export type Service = {
  id: string;
  slug: string;
  name: string;
  price: string | number | null;
  durationMinutes: number;
  imageUrl: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
};

type Props = {
  services: Service[];
  /** Translated copy for the current locale, keyed services_section.<slug>.* */
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  onReload: () => void;
  inputStyle: React.CSSProperties;
};

export function ServicesEditor({
  services,
  values,
  onValueChange,
  onReload,
  inputStyle,
}: Props) {
  const [open, setOpen] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const patch = async (id: string, data: Record<string, unknown>) => {
    await fetch(`/api/studio/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onReload();
  };

  const add = async () => {
    if (newName.trim().length < 2) return;
    setAdding(true);
    await fetch("/api/studio/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setAdding(false);
    onReload();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/studio/services/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    onReload();
  };

  return (
    <>
      <div className="space-y-3">
        {services.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            isOpen={open === service.id}
            onToggle={() => setOpen(open === service.id ? "" : service.id)}
            values={values}
            onValueChange={onValueChange}
            onPatch={(data) => patch(service.id, data)}
            onDelete={() => setDeleteTarget(service)}
            inputStyle={inputStyle}
          />
        ))}
      </div>

      {/* Add */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nombre del servicio nuevo..."
          autoComplete="off"
          style={inputStyle}
        />
        <button
          onClick={add}
          disabled={adding || newName.trim().length < 2}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          {adding ? "Agregando..." : "Agregar"}
        </button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar servicio"
        message={
          deleteTarget
            ? `¿Eliminar "${deleteTarget.name}"? Desaparece de tu web y de la lista al agendar. Las citas pasadas conservan el nombre, así que tu historial queda intacto.`
            : ""
        }
        confirmLabel={deleting ? "Eliminando..." : "Eliminar"}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function ServiceRow({
  service,
  isOpen,
  onToggle,
  values,
  onValueChange,
  onPatch,
  onDelete,
  inputStyle,
}: {
  service: Service;
  isOpen: boolean;
  onToggle: () => void;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  onPatch: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  inputStyle: React.CSSProperties;
}) {
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(
    service.price != null ? String(Number(service.price)) : "",
  );
  const [duration, setDuration] = useState(String(service.durationMinutes ?? 60));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(service.name);
    setPrice(service.price != null ? String(Number(service.price)) : "");
    setDuration(String(service.durationMinutes ?? 60));
  }, [service.name, service.price, service.durationMinutes]);

  const pickPhoto = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      // Straight from the browser to Blob — the file never goes through us.
      const blob = await upload(`services/${service.slug}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/studio/upload",
      });
      onPatch({ imageUrl: blob.url });
    } catch (err) {
      const message = (err as Error).message ?? "";
      setUploadError(
        message.includes("501") || message.toLowerCase().includes("not set up")
          ? "El almacenamiento de fotos aún no está conectado."
          : "No se pudo subir la foto. Prueba con una imagen más pequeña.",
      );
    } finally {
      setUploading(false);
    }
  };

  const numericPrice = Number(price);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--admin-border)", opacity: service.active ? 1 : 0.55 }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--admin-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform"
          style={{ color: "var(--admin-muted)", transform: isOpen ? "rotate(90deg)" : "none" }}
        />
        {service.imageUrl ? (
          // plain img: Blob hostnames are not in next.config images.remotePatterns
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.imageUrl}
            alt=""
            className="h-8 w-8 rounded-lg object-cover shrink-0"
          />
        ) : (
          <span
            className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center"
            style={{ backgroundColor: "var(--admin-filter-bg)" }}
          >
            <ImagePlus className="h-4 w-4" style={{ color: "var(--admin-muted)" }} />
          </span>
        )}
        <span className="text-sm font-semibold flex-1 min-w-0 truncate" style={{ color: "var(--admin-text)" }}>
          {service.name}
          {!service.active && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--admin-muted)" }}>
              oculto
            </span>
          )}
        </span>
        <span className="text-xs shrink-0" style={{ color: "var(--admin-muted)" }}>
          {(service.durationMinutes ?? 60) < 60
            ? `${service.durationMinutes}min`
            : `${Math.floor((service.durationMinutes ?? 60) / 60)}h`}
        </span>
        <span
          className="text-sm font-medium shrink-0"
          style={{ color: Number(service.price) > 0 ? "var(--admin-text)" : "var(--admin-muted)" }}
        >
          {Number(service.price) > 0 ? `$${Number(service.price)}` : "sin precio"}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--admin-border)" }}>
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--admin-text)" }}>
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => name.trim() !== service.name && onPatch({ name: name.trim() })}
                autoComplete="off"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--admin-text)" }}>
                Precio
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--admin-muted)" }}>
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={() =>
                    onPatch({ price: numericPrice > 0 ? numericPrice : null })
                  }
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: 30 }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--admin-text)" }}>
              Cuánto dura
            </label>
            <select
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                onPatch({ durationMinutes: Number(e.target.value) });
              }}
              style={inputStyle}
            >
              {[15, 30, 45, 60, 90, 120, 150, 180, 240].map((mins) => (
                <option key={mins} value={String(mins)}>
                  {humanDuration(mins)}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: "var(--admin-muted)" }}>
Sirve para calcular en qué horarios todavía te pueden reservar.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--admin-text)" }}>
              Título en la web
            </label>
            <input
              type="text"
              value={values[`services_section.${service.slug}.title`] ?? ""}
              onChange={(e) =>
                onValueChange(`services_section.${service.slug}.title`, e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--admin-text)" }}>
              Descripción
            </label>
            <textarea
              value={values[`services_section.${service.slug}.description`] ?? ""}
              onChange={(e) =>
                onValueChange(`services_section.${service.slug}.description`, e.target.value)
              }
              rows={3}
              style={inputStyle}
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--admin-text)" }}>
              Foto
            </label>
            <div className="flex items-center gap-3">
              {service.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="h-20 w-20 rounded-xl object-cover shrink-0"
                  style={{ border: "1px solid var(--admin-border)" }}
                />
              ) : (
                <span
                  className="h-20 w-20 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: "var(--admin-filter-bg)" }}
                >
                  <ImagePlus className="h-6 w-6" style={{ color: "var(--admin-muted)" }} />
                </span>
              )}

              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) pickPhoto(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-40 transition-colors"
                  style={{ border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {uploading ? "Subiendo..." : service.imageUrl ? "Cambiar foto" : "Subir foto"}
                </button>
                {service.imageUrl && (
                  <button
                    type="button"
                    onClick={() => onPatch({ imageUrl: null })}
                    className="text-xs text-left cursor-pointer"
                    style={{ color: "var(--admin-muted)" }}
                  >
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
            {uploadError && (
              <p className="flex items-start gap-1.5 text-xs mt-2" style={{ color: "#b91c1c" }}>
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {uploadError}
              </p>
            )}
          </div>

          {/* Row actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onPatch({ active: !service.active })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors"
              style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
            >
              {service.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {service.active ? "Ocultar de la web" : "Mostrar en la web"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Eliminar ${service.name}`}
              title={`Eliminar ${service.name}`}
              className="flex items-center justify-center px-4 py-2 rounded-xl cursor-pointer transition-colors sm:ml-auto"
              style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
