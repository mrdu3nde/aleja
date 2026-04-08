"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { AccordionItem } from "@/components/ui/Accordion";
import { motion } from "framer-motion";

type FaqItem = {
  question: string;
  answer: string;
};

export default function FAQPage() {
  const t = useTranslations("faq_page");
  const items: FaqItem[] = t.raw("items");

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
            {t("title")}
          </motion.h1>
          <p className="text-text-light text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
      </section>

      <Section bg="white">
        <div className="max-w-3xl mx-auto">
          {items.map((item: FaqItem, i: number) => (
            <AccordionItem
              key={i}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
