"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export function BookingCTA({ content }: { content: Record<string, string> }) {
  const t = useTranslations("booking_cta");
  const locale = useLocale();

  return (
    <section className="bg-cafe py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-white mb-4"
        >
          {content["booking_cta.title"] || t("title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-champagne/80 text-lg mb-8 max-w-xl mx-auto"
        >
          {content["booking_cta.subtitle"] || t("subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button href={`/${locale}/book`} variant="secondary" size="lg">
            {t("cta")}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
