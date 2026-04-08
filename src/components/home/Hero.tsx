"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import Image from "next/image";

export function Hero({ content }: { content: Record<string, string> }) {
  const t = useTranslations("hero");
  const locale = useLocale();

  const headline = content["hero.headline"] || t("headline");
  const subheadline = content["hero.subheadline"] || t("subheadline");

  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80"
          alt="Beauty salon"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-champagne-light/95 via-champagne-light/85 to-champagne-light/50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-36">
        <div className="max-w-2xl">
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
            className="mt-6 text-lg md:text-xl text-text-dark/80 max-w-xl leading-relaxed"
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
    </section>
  );
}
