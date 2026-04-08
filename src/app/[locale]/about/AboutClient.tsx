"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export function AboutClient({ content }: { content: Record<string, string> }) {
  const t = useTranslations("about_page");
  const ht = useTranslations("hero");
  const locale = useLocale();

  const differenceItems: string[] = t.raw("difference_items");

  const c = (key: string, fallback: string) => content[key] || fallback;

  return (
    <>
      <section className="bg-gradient-to-br from-champagne-light to-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-cafe mb-4"
          >
            {c("about_page.title", t("title"))}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-text-light text-lg max-w-2xl"
          >
            {c("about_page.intro", t("intro"))}
          </motion.p>
        </div>
      </section>

      <Section bg="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-champagne to-mushroom-light flex items-center justify-center">
            <span className="text-cafe/40 text-sm">Photo</span>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-cafe mb-4">
              {t("story_title")}
            </h2>
            <p className="text-text-light leading-relaxed">
              {c("about_page.story", t("story"))}
            </p>
          </div>
        </div>
      </Section>

      <Section bg="mushroom">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-cafe mb-6">
            {t("philosophy_title")}
          </h2>
          <p className="text-text-light text-lg leading-relaxed">
            {c("about_page.philosophy", t("philosophy"))}
          </p>
        </div>
      </Section>

      <Section bg="white">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-cafe mb-8 text-center">
          {t("difference_title")}
        </h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {differenceItems.map((item: string, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne">
                <Check className="h-3.5 w-3.5 text-cafe" />
              </div>
              <p className="text-text-dark">{item}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section bg="champagne">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-cafe mb-6">
            {t("commitment_title")}
          </h2>
          <p className="text-text-light text-lg leading-relaxed mb-8">
            {c("about_page.commitment", t("commitment"))}
          </p>
          <Button href={`/${locale}/book`} size="lg">
            {ht("cta_primary")}
          </Button>
        </div>
      </Section>
    </>
  );
}
