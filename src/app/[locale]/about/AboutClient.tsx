"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { BrandFrame } from "@/components/ui/BrandFrame";

/**
 * El texto largo se guarda con líneas en blanco entre párrafos, igual que ella
 * lo dictó. Aquí se parte para que respire en pantalla: un bloque corrido de
 * cuatro párrafos se lee como un muro y nadie llega al final.
 */
function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i} className={className}>
            {paragraph}
          </p>
        ))}
    </>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export function AboutClient({
  content,
  brandLogo,
}: {
  content: Record<string, string>;
  brandLogo: string | null;
}) {
  const t = useTranslations("about_page");
  const ht = useTranslations("hero");
  const locale = useLocale();

  const c = (key: string, fallback: string) => content[key] || fallback;

  return (
    <>
      {/* 1. Portada — el concepto antes que nada */}
      <section className="bg-gradient-to-br from-champagne-light via-warm-white to-champagne/40 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] tracking-[0.28em] text-xs md:text-sm text-gold mb-6"
          >
            {c("about_page.title", t("title")).toUpperCase()}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl lg:text-6xl text-cafe max-w-4xl leading-[1.15]"
          >
            {c("about_page.tagline", t("tagline"))}
          </motion.h1>
        </div>
      </section>

      {/* 2. La marca y su filosofía, juntas: quién habla, antes de qué dice */}
      <Section bg="white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="md:col-span-5">
            <BrandFrame src={brandLogo} alt={t("logo_alt")} priority />
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-7 md:pl-4"
          >
            <h2 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl text-cafe mb-6">
              {t("philosophy_title")}
            </h2>
            <Paragraphs
              text={c("about_page.philosophy", t("philosophy"))}
              className="text-text-light text-lg md:text-xl leading-relaxed"
            />
          </motion.div>
        </div>
      </Section>

      {/* 3. Su historia, en columna estrecha para que se lea como un relato */}
      <Section bg="champagne">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl text-cafe mb-8 text-center"
          >
            {t("story_title")}
          </motion.h2>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <Paragraphs
              text={c("about_page.story", t("story"))}
              className="text-text-light leading-[1.85]"
            />
          </motion.div>
        </div>
      </Section>

      {/* 4. La experiencia — lo que la diferencia de un salón cualquiera */}
      <Section bg="mushroom">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl text-cafe mb-10">
            {t("experience_title")}
          </h2>
          <div className="space-y-6">
            <Paragraphs
              text={c("about_page.experience", t("experience"))}
              className="text-text-light text-lg md:text-xl leading-relaxed"
            />
          </div>
          <p className="font-[family-name:var(--font-heading)] text-xl md:text-2xl text-cafe mt-10">
            {t("experience_closing")}
          </p>
        </motion.div>
      </Section>

      {/* 5. La frase de marca, sola sobre el café oscuro, y la invitación */}
      <section className="bg-cafe py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7 }}
            className="wordmark-gold-on-dark font-[family-name:var(--font-heading)] text-2xl md:text-4xl tracking-[0.2em] mb-10"
          >
            PRESENCE IS POWER
          </motion.p>
          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.15 }}>
            <Button href={`/${locale}/book`} size="lg">
              {ht("cta_primary")}
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
