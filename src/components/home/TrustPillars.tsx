"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Heart, Star, Sparkles, Smile } from "lucide-react";
import { motion } from "framer-motion";

const pillars = [
  { key: "personalized", icon: Heart },
  { key: "quality", icon: Star },
  { key: "results", icon: Sparkles },
  { key: "experience", icon: Smile },
] as const;

export function TrustPillars({ content }: { content: Record<string, string> }) {
  const t = useTranslations("trust");

  return (
    <Section bg="white">
      <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe text-center mb-12">
        {content["trust.title"] || t("title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <pillar.icon className="h-6 w-6 text-cafe" />
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
