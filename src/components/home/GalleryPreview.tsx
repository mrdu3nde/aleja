"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import type { GalleryPhoto } from "@/lib/gallery";

/** Las primeras cuatro fotos que ella subió. Sin fotos, la sección no sale. */
export function GalleryPreview({ photos }: { photos: GalleryPhoto[] }) {
  const t = useTranslations("gallery_preview");
  const locale = useLocale();

  if (photos.length === 0) return null;

  return (
    <Section bg="champagne">
      <div className="text-center mb-10">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe mb-3">
          {t("title")}
        </h2>
        <p className="text-text-light text-lg">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.slice(0, 4).map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="aspect-square rounded-xl overflow-hidden relative group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt ?? ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-cafe/0 group-hover:bg-cafe/20 transition-colors duration-300" />
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Button href={`/${locale}/gallery`} variant="outline">
          {t("cta")}
        </Button>
      </div>
    </Section>
  );
}
