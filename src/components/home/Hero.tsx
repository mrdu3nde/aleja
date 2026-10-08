"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { motion } from "framer-motion";
import Image from "next/image";

/**
 * La portada.
 *
 * Antes llevaba una foto de un salón cualquiera en tonos taupe. Ella pidió
 * quitarla y poner la imagen de ALUH, así que el lado derecho es la marca:
 * el archivo del logo si existe (`brandLogo`), o el logotipo dorado si no.
 */
export function Hero({
  content,
  brandLogo,
}: {
  content: Record<string, string>;
  brandLogo: string | null;
}) {
  const t = useTranslations("hero");
  const locale = useLocale();

  const headline = content["hero.headline"] || t("headline");
  const subheadline = content["hero.subheadline"] || t("subheadline");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-champagne-light via-warm-white to-champagne-light">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* La marca. En el teléfono va primero: es lo que ella quiere que se
              vea al entrar. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="order-first lg:order-last flex flex-col items-center text-center"
          >
            {brandLogo ? (
              <div className="relative w-full max-w-md aspect-square">
                <Image
                  src={brandLogo}
                  alt="ALUH"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <>
                <Wordmark size="xl" />
                <span className="mt-6 h-px w-24 bg-gold/60" aria-hidden />
                <p className="mt-5 font-[family-name:var(--font-heading)] text-xs sm:text-sm tracking-[0.35em] text-cafe-light">
                  PRESENCE IS POWER
                </p>
              </>
            )}
          </motion.div>

          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl md:text-6xl font-bold text-cafe leading-tight tracking-wide"
            >
              {headline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg md:text-xl text-text-dark/80 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {subheadline}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button href={`/${locale}/book`} size="lg">
                {t("cta_primary")}
              </Button>
              <Button href={`/${locale}/services`} variant="outline" size="lg">
                {t("cta_secondary")}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
