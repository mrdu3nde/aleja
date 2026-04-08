"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const filters = ["all", "hair", "nails", "brows", "lashes"] as const;

const galleryItems = [
  { id: 1, category: "hair", src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80", alt: "Hair color" },
  { id: 2, category: "nails", src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80", alt: "Nail art" },
  { id: 3, category: "brows", src: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80", alt: "Brow styling" },
  { id: 4, category: "lashes", src: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&q=80", alt: "Lash extensions" },
  { id: 5, category: "hair", src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80", alt: "Hair styling" },
  { id: 6, category: "nails", src: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80", alt: "Manicure" },
  { id: 7, category: "brows", src: "https://images.unsplash.com/photo-1594032194509-0f8002e21be4?w=600&q=80", alt: "Brow treatment" },
  { id: 8, category: "hair", src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80", alt: "Salon style" },
  { id: 9, category: "lashes", src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80", alt: "Beauty treatment" },
  { id: 10, category: "nails", src: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80", alt: "Nail design" },
  { id: 11, category: "hair", src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80", alt: "Hair treatment" },
  { id: 12, category: "brows", src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80", alt: "Facial care" },
];

export default function GalleryPage() {
  const t = useTranslations("gallery_page");
  const [active, setActive] = useState<(typeof filters)[number]>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered =
    active === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === active);

  const lightboxIndex = lightbox !== null ? filtered.findIndex((g) => g.id === lightbox) : -1;

  const goPrev = useCallback(() => {
    if (lightboxIndex > 0) setLightbox(filtered[lightboxIndex - 1].id);
  }, [lightboxIndex, filtered]);

  const goNext = useCallback(() => {
    if (lightboxIndex < filtered.length - 1) setLightbox(filtered[lightboxIndex + 1].id);
  }, [lightboxIndex, filtered]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, goPrev, goNext]);

  return (
    <>
      <section className="bg-gradient-to-br from-champagne-light to-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-cafe mb-4"
          >
            {t("title")}
          </motion.h1>
          <p className="text-text-light text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
      </section>

      <Section bg="white">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                active === f
                  ? "bg-cafe text-white"
                  : "bg-mushroom-light/50 text-text-dark hover:bg-mushroom-light"
              }`}
            >
              {t(`filter_${f}`)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
                onClick={() => setLightbox(item.id)}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-cafe/0 group-hover:bg-cafe/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium capitalize">
                    {item.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>

            {/* Prev arrow */}
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Next arrow */}
            {lightboxIndex < filtered.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightbox}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl aspect-square rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const item = filtered.find((g) => g.id === lightbox);
                if (!item) return null;
                return (
                  <Image
                    src={item.src.replace("w=600", "w=1200")}
                    alt={item.alt}
                    fill
                    className="object-cover"
                  />
                );
              })()}
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 text-white/70 text-sm">
              {lightboxIndex + 1} / {filtered.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
