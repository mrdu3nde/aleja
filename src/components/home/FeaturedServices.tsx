"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Scissors, Palette, Eye, Sparkles, Droplets, Crown } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { key: "hair", icon: Scissors },
  { key: "nails", icon: Palette },
  { key: "brows", icon: Eye },
  { key: "lashes", icon: Sparkles },
  { key: "facial", icon: Droplets },
  { key: "special", icon: Crown },
] as const;

export function FeaturedServices({ content }: { content: Record<string, string> }) {
  const t = useTranslations("services_section");
  const locale = useLocale();

  return (
    <Section bg="mushroom">
      <div className="text-center mb-12">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe mb-4">
          {content["services_section.title"] || t("title")}
        </h2>
        <p className="text-text-light text-lg max-w-2xl mx-auto">
          {content["services_section.subtitle"] || t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, i) => (
          <motion.div
            key={service.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Card hover className="h-full flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne">
                <service.icon className="h-6 w-6 text-cafe" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                {content[`services_section.${service.key}.title`] || t(`${service.key}.title`)}
              </h3>
              <p className="text-text-light text-sm leading-relaxed flex-1">
                {content[`services_section.${service.key}.description`] || t(`${service.key}.description`)}
              </p>
              <div className="mt-4">
                <Button href={`/${locale}/services`} variant="ghost" size="sm">
                  {t("book_now")} &rarr;
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Button href={`/${locale}/services`} variant="outline">
          {t("view_all")}
        </Button>
      </div>
    </Section>
  );
}
