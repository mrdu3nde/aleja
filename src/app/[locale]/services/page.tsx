"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { GoldRule } from "@/components/ui/GoldRule";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { CONTACT } from "@/lib/contact";
import {
  CATEGORIES,
  isBookable,
  itemsOf,
  priceLabel,
  type CatalogItem,
} from "@/lib/catalog";

/**
 * La carta completa. Sin encabezado ni texto introductorio (ella pidió
 * quitarlos): empieza directo con las categorías. Los servicios y precios
 * salen de src/lib/catalog.ts, lo mismo que reserva el formulario.
 */
export default function ServicesPage() {
  const t = useTranslations("services_page");
  const locale = useLocale();
  const lang = locale === "es" ? "es" : "en";

  const row = (item: CatalogItem) => (
    <li key={item.id}>
      <div className="flex items-baseline gap-3">
        <span className="text-text-dark font-medium">{item.name[lang]}</span>
        {/* Línea de puntos entre nombre y precio, como en una carta. */}
        <span aria-hidden className="flex-1 border-b border-dotted border-mushroom" />
        <span className="text-cafe font-semibold whitespace-nowrap">{priceLabel(item.price, lang)}</span>
      </div>
      {item.description && (
        <p className="mt-1 text-sm text-text-light leading-relaxed">{item.description[lang]}</p>
      )}
      <div className="mt-1.5 text-xs">
        {isBookable(item) ? (
          <Link
            href={`/${locale}/book?service=${item.id}`}
            className="font-semibold uppercase tracking-wider text-gold-deep hover:text-cafe"
          >
            {t("book")} →
          </Link>
        ) : (
          <a href={CONTACT.phoneHref} className="inline-flex items-center gap-1 text-text-light hover:text-cafe">
            <Phone className="h-3 w-3" />
            {t("by_phone")}
          </a>
        )}
      </div>
    </li>
  );

  return (
    <>
      {CATEGORIES.map((cat, ci) => {
        const items = itemsOf(cat.slug);
        return (
          <Section key={cat.slug} bg={ci % 2 === 0 ? "white" : "mushroom"}>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe text-center tracking-wide">
              {cat.title[lang]}
            </h2>
            {cat.subtitle && (
              <p className="mt-3 text-center text-text-light">{cat.subtitle[lang]}</p>
            )}
            <GoldRule className="mx-auto mt-5 mb-12" />

            <div className="mx-auto max-w-3xl space-y-14">
              {cat.groups ? (
                cat.groups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                  >
                    <h3 className="font-[family-name:var(--font-heading)] text-lg md:text-xl tracking-[0.2em] text-gold-deep uppercase mb-5">
                      {group.title[lang]}
                    </h3>
                    <ul className="space-y-5">
                      {items.filter((i) => i.group === group.id).map(row)}
                    </ul>
                    {group.note && (
                      <div className="mt-5 space-y-2 border-l-2 border-gold/50 pl-4 text-sm text-text-light leading-relaxed">
                        {group.note[lang].split("\n\n").map((para, pi) => (
                          <p key={pi}>{para}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.ul
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {items.map(row)}
                </motion.ul>
              )}
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
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={`/${locale}/book`} variant="secondary" size="lg">
              {t("consult_cta")}
            </Button>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-champagne/50 px-6 py-3 text-champagne hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {t("call")} {CONTACT.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
