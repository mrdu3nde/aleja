"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export function Hero({ content }: { content: Record<string, string> }) {
  const t = useTranslations("hero");
  const locale = useLocale();

  const headline = content["hero.headline"] || t("headline");
  const subheadline = content["hero.subheadline"] || t("subheadline");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-champagne-light via-warm-white to-mushroom-light/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl md:text-6xl font-bold text-cafe leading-tight"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg md:text-xl text-text-light max-w-2xl leading-relaxed"
          >
            {subheadline}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <Button href={`/${locale}/book`} size="lg">
              {t("cta_primary")}
            </Button>
            <Button href={`/${locale}/services`} variant="outline" size="lg">
              {t("cta_secondary")}
            </Button>
          </motion.div>
        </div>
      </div>
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-champagne/30 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-60 w-60 rounded-full bg-mushroom-light/20 blur-3xl" />
    </section>
  );
}
