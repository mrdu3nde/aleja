"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

const categoryKeys = [
  "hair",
  "nails",
  "brows",
  "lashes",
  "facial",
  "special",
] as const;

type ServiceItem = {
  name: string;
  description: string;
  ideal_for: string;
  duration: string;
  price: string;
};

export default function ServicesPage() {
  const t = useTranslations("services_page");
  const locale = useLocale();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-champagne-light to-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-cafe mb-4"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-text-light text-lg max-w-2xl"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Categories */}
      {categoryKeys.map((key, ci) => {
        const items: ServiceItem[] = t.raw(`categories.${key}.items`);
        return (
          <Section key={key} bg={ci % 2 === 0 ? "white" : "mushroom"}>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-cafe mb-8">
              {t(`categories.${key}.title`)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item: ServiceItem, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <ServiceCard
                    name={item.name}
                    description={item.description}
                    idealFor={item.ideal_for}
                    duration={item.duration}
                    price={item.price}
                  />
                </motion.div>
              ))}
            </div>
          </Section>
        );
      })}

      {/* Consultation CTA */}
      <section className="bg-cafe py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-white mb-3">
            {t("consult_title")}
          </h2>
          <p className="text-champagne/80 mb-8 max-w-lg mx-auto">
            {t("consult_text")}
          </p>
          <Button href={`/${locale}/contact`} variant="secondary" size="lg">
            {t("consult_cta")}
          </Button>
        </div>
      </section>
    </>
  );
}
