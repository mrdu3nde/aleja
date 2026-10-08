"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryPhoto } from "@/lib/gallery";

/**
 * Las fotos que ella sube, con visor a pantalla completa.
 *
 * `<img>` y no `next/image`: las fotos viven en Blob, cuyo dominio no está
 * registrado en next.config (igual que las fotos de servicios).
 */
export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const goPrev = useCallback(() => setOpen((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(
    () => setOpen((i) => (i !== null && i < photos.length - 1 ? i + 1 : i)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goPrev, goNext]);

  const current = open !== null ? photos[open] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, i) => (
          <motion.button
            key={photo.id}
            type="button"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
            className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
            onClick={() => setOpen(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt ?? ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
            onClick={() => setOpen(null)}
          >
            <button
              onClick={() => setOpen(null)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>

            {open! > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Anterior"
                className="absolute left-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            {open! < photos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Siguiente"
                className="absolute right-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* `contain`: en el visor se ve la foto entera, sin recortar. */}
            <motion.img
              key={current.id}
              src={current.url}
              alt={current.alt ?? ""}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 text-white/70 text-sm">
              {open! + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
