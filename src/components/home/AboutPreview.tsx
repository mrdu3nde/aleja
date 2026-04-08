"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Image from "next/image";

export function AboutPreview({ content }: { content: Record<string, string> }) {
  const t = useTranslations("about_preview");
  const locale = useLocale();

  return (
    <Section bg="white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="aspect-[4/5] rounded-2xl overflow-hidden relative"
        >
          <Image
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"
            alt="Beauty professional"
            fill
            className="object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe mb-6">
            {content["about_preview.title"] || t("title")}
          </h2>
          <p className="text-text-light text-lg leading-relaxed mb-8">
            {content["about_preview.text"] || t("text")}
          </p>
          <Button href={`/${locale}/about`} variant="secondary">
            {t("cta")}
          </Button>
        </motion.div>
      </div>
    </Section>
  );
}
