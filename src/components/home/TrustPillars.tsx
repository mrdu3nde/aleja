"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { GoldRule } from "@/components/ui/GoldRule";
import { Heart, Gem, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// Las tres palabras de su lema: Personalized. Refined. Intentional.
const pillars = [
  { key: "personalized", icon: Heart },
  { key: "refined", icon: Gem },
  { key: "intentional", icon: Sparkles },
] as const;

export function TrustPillars({ content }: { content: Record<string, string> }) {
  const t = useTranslations("trust");

  return (
    <Section bg="white">
      <div className="text-center mb-12">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe tracking-wide">
          {content["trust.title"] || t("title")}
        </h2>
        <GoldRule className="mx-auto my-5" />
        <p className="font-[family-name:var(--font-heading)] text-sm md:text-base tracking-[0.25em] text-cafe-light">
          {content["trust.subtitle"] || t("subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
        {pillars.map((pillar, i) => (
          <motion.div
            key={pillar.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-champagne">
              <pillar.icon className="h-6 w-6 text-gold-deep" />
            </div>
            <h3 className="text-lg font-semibold text-text-dark mb-2">
              {content[`trust.${pillar.key}`] || t(pillar.key)}
            </h3>
            <p className="text-sm text-text-light leading-relaxed">
              {content[`trust.${pillar.key}_desc`] || t(`${pillar.key}_desc`)}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
