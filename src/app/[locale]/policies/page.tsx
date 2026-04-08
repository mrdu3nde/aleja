"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

type PolicySection = {
  title: string;
  content: string;
};

export default function PoliciesPage() {
  const t = useTranslations("policies_page");
  const sections: PolicySection[] = t.raw("sections");

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
        <div className="max-w-3xl mx-auto space-y-6">
          {sections.map((section: PolicySection, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card>
                <h2 className="text-xl font-semibold text-cafe mb-3">
                  {section.title}
                </h2>
                <p className="text-text-light leading-relaxed">
                  {section.content}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
}
