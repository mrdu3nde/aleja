"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";

export function Testimonials() {
  const t = useTranslations("testimonials");
  const items = [0, 1, 2];

  return (
    <Section bg="white">
      <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe text-center mb-12">
        {t("title")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="h-full flex flex-col">
              <Quote className="h-8 w-8 text-champagne mb-4" />
              <p className="text-text-dark leading-relaxed flex-1 italic">
                &ldquo;{t(`items.${i}.text`)}&rdquo;
              </p>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-semibold text-text-dark">
                  {t(`items.${i}.name`)}
                </span>
                <Badge>{t(`items.${i}.service`)}</Badge>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
