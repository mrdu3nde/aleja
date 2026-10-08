"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/Button";
import { GoldRule } from "@/components/ui/GoldRule";
import { motion } from "framer-motion";

// El cabello va primero y como carta de precios (su menú real). El resto
// sigue en tarjetas. Uñas se quitó a pedido de ella.
const categoryKeys = ["brows", "lashes", "facial", "special"] as const;

type MenuGroup = {
  title: string;
  note?: string;
  items: { name: string; price: string; description?: string }[];
};

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

      {/* Cabello: su carta */}
      <Section bg="white">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe text-center tracking-wide">
          {t("categories.hair.title")}
        </h2>
        <GoldRule className="mx-auto mt-5 mb-12" />
        <div className="mx-auto max-w-3xl space-y-14">
          {(t.raw("categories.hair.groups") as MenuGroup[]).map((group, gi) => (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="font-[family-name:var(--font-heading)] text-lg md:text-xl tracking-[0.2em] text-gold-deep uppercase mb-5">
                {group.title}
              </h3>
              <ul className="space-y-4">
                {group.items.map((item, ii) => (
                  <li key={ii}>
                    <div className="flex items-baseline gap-3">
                      <span className="text-text-dark font-medium">{item.name}</span>
                      {/* Línea de puntos entre nombre y precio, como en una carta. */}
                      <span aria-hidden className="flex-1 border-b border-dotted border-mushroom" />
                      <span className="text-cafe font-semibold whitespace-nowrap">{item.price}</span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-text-light">{item.description}</p>
                    )}
                  </li>
                ))}
              </ul>
              {group.note && (
                <div className="mt-5 space-y-2 border-l-2 border-gold/50 pl-4 text-sm text-text-light leading-relaxed">
                  {group.note.split("\n\n").map((para, pi) => (
                    <p key={pi}>{para}</p>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Las demás categorías */}
      {categoryKeys.map((key, ci) => {
        const items: ServiceItem[] = t.raw(`categories.${key}.items`);
        return (
          <Section key={key} bg={ci % 2 === 0 ? "mushroom" : "white"}>
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
          <Button href={`/${locale}/book`} variant="secondary" size="lg">
            {t("consult_cta")}
          </Button>
        </div>
      </section>
    </>
  );
}
