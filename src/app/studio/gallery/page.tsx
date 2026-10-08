"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Images, Trash2 } from "lucide-react";
import { uploadImage, UploadNotConfiguredError } from "@/lib/upload-image";

type Photo = { id: string; url: string; alt: string | null };

/** Ella pidió subir sus 10 mejores fotos. No es un límite, es la meta. */
const GOAL = 10;

export default function StudioGalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    fetch("/api/studio/gallery")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d: { data: Photo[] }) => setPhotos(d.data))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files);
    setUploading(list.length);
    // Una por una y en el orden elegido, así quedan en la galería igual.
    for (const file of list) {
      try {
        const url = await uploadImage(`gallery/${file.name}`, file);
        await fetch("/api/studio/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } catch (err) {
        setError(
          err instanceof UploadNotConfiguredError
            ? "El almacenamiento de fotos aún no está conectado."
            : "Una foto no se pudo subir. Prueba con una imagen más pequeña (máx. 8 MB).",
        );
      }
      setUploading((n) => n - 1);
    }
    if (input.current) input.current.value = "";
    load();
  };

  const move = async (index: number, delta: -1 | 1) => {
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setPhotos(next);
    await fetch("/api/studio/gallery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
  };

  const remove = async (id: string) => {
    setConfirmId(null);
    setPhotos((list) => list.filter((p) => p.id !== id));
    await fetch(`/api/studio/gallery/${id}`, { method: "DELETE" });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <Images className="h-6 w-6" />
            Galería
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
            {photos.length === 0
              ? "Todavía no hay fotos. Mientras tanto la galería del sitio dice \"Muy pronto\"."
              : `${photos.length} de ${GOAL} fotos. Las primeras cuatro salen también en el inicio.`}
          </p>
        </div>
        <button
          onClick={() => input.current?.click()}
          disabled={uploading > 0}
          className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <ImagePlus className="h-4 w-4" />
          {uploading > 0 ? `Subiendo… (${uploading})` : "Subir fotos"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--admin-hover)", color: "var(--admin-text)" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>Cargando…</p>
      ) : photos.length === 0 ? (
        <button
          onClick={() => input.current?.click()}
          className="w-full rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer"
          style={{ border: "2px dashed var(--admin-input-border)", color: "var(--admin-muted)" }}
        >
          <ImagePlus className="h-10 w-10" />
          <span className="text-sm">Toca para elegir tus mejores fotos. Puedes elegir varias a la vez.</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
            >
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.alt ?? ""} className="h-full w-full object-cover" />
                <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
                  {i + 1}
                </span>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="flex gap-1">
                  <IconButton label="Mover antes" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Mover después" disabled={i === photos.length - 1} onClick={() => move(i, 1)}>
                    <ArrowRight className="h-4 w-4" />
                  </IconButton>
                </div>
                {/* Dos toques para quitar: así un dedo despistado no borra nada. */}
                {confirmId === photo.id ? (
                  <button
                    onClick={() => remove(photo.id)}
                    className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                  >
                    ¿Quitar?
                  </button>
                ) : (
                  <IconButton label="Quitar foto" onClick={() => setConfirmId(photo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg p-2 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
      style={{ color: "var(--admin-text)", backgroundColor: "var(--admin-hover)" }}
    >
      {children}
    </button>
  );
}
