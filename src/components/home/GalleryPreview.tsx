"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

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
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="aspect-square rounded-xl bg-gradient-to-br from-mushroom-light to-champagne flex items-center justify-center"
          >
            <span className="text-cafe/30 text-sm">Photo {i}</span>
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
