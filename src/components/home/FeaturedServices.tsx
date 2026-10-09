"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Scissors, Palette, Eye, Sparkles, Droplets, Crown, type LucideIcon } from "lucide-react";
import type { PublicService } from "@/lib/services";
import { CATALOG } from "@/lib/catalog";

/** "Desde $X": lo más barato de esa categoría en la carta, que es la misma de /services. */
function fromPrice(slug: string, fallback: number | null): number | null {
  const prices = CATALOG.filter((i) => i.category === slug && i.price).map((i) => i.price!.min);
  return prices.length ? Math.min(...prices) : fallback;
}
import { motion } from "framer-motion";

/** Icons the studio can pick from; used when a service has no photo yet. */
const ICONS: Record<string, LucideIcon> = {
  Scissors, Palette, Eye, Sparkles, Droplets, Crown,
};

export function FeaturedServices({
  content,
  services,
}: {
  content: Record<string, string>;
  services: PublicService[];
}) {
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
        {services.map((service, i) => {
          const Icon = (service.icon && ICONS[service.icon]) || Sparkles;
          // Lo editado en el panel manda; si no, el texto traducido del
          // sitio. El nombre de la base ("Hair Services") sólo como último
          // recurso, porque está en inglés y se colaba en la versión española.
          const key = `${service.slug}.title`;
          const title =
            content[`services_section.${key}`] || (t.has(key) ? t(key) : service.name);
          const descKey = `${service.slug}.description`;
          const description =
            content[`services_section.${descKey}`] ?? (t.has(descKey) ? t(descKey) : "");
          return (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Card hover className="h-full flex flex-col overflow-hidden">
              {service.imageUrl ? (
                /* plain img: Blob hostnames are not registered in next.config */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={service.imageUrl}
                  alt={title}
                  className="mb-4 -mx-6 -mt-6 h-44 w-[calc(100%+3rem)] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne">
                  <Icon className="h-6 w-6 text-cafe" />
                </div>
              )}
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                {title}
              </h3>
              {(() => {
                const from = fromPrice(service.slug, service.price);
                return from != null && from > 0 ? (
                  <p className="text-cafe font-semibold mb-2">{t("starting_at")} ${from}</p>
                ) : null;
              })()}
              <p className="text-text-light text-sm leading-relaxed flex-1">
                {description}
              </p>
              <div className="mt-4">
                <Button href={`/${locale}/services`} variant="ghost" size="sm">
                  {t("book_now")} &rarr;
                </Button>
              </div>
            </Card>
          </motion.div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Button href={`/${locale}/services`} variant="outline">
          {t("view_all")}
        </Button>
      </div>
    </Section>
  );
}
