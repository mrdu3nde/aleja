"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Image from "next/image";

const previewImages = [
  {
    src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80",
    alt: "Hair styling",
  },
  {
    src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80",
    alt: "Nail art",
  },
  {
    src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80",
    alt: "Beauty treatment",
  },
  {
    src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80",
    alt: "Facial care",
  },
];

export function GalleryPreview() {
  const t = useTranslations("gallery_preview");
  const locale = useLocale();

  return (
    <Section bg="champagne">
      <div className="text-center mb-10">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe mb-3">
          {t("title")}
        </h2>
        <p className="text-text-light text-lg">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previewImages.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="aspect-square rounded-xl overflow-hidden relative group"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
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
