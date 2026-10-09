"use client";

import { useTranslations, useLocale } from "next-intl";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ReviewList } from "@/components/reviews/ReviewList";
import type { PublicReview } from "@/lib/reviews";

/**
 * Reseñas reales, las que ella aprobó. Sin ninguna, una invitación a dejar la
 * primera: antes había dos testimonios inventados y ella pidió no tener ficticias.
 */
export function Testimonials({ reviews }: { reviews: PublicReview[] }) {
  const t = useTranslations("testimonials");
  const locale = useLocale();

  return (
    <Section bg="white">
      <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe text-center mb-12">
        {t("title")}
      </h2>

      {reviews.length > 0 ? (
        <ReviewList reviews={reviews} />
      ) : (
        <p className="text-center text-text-light max-w-md mx-auto">{t("empty")}</p>
      )}

      <div className="mt-10 text-center">
        <Button href={`/${locale}/reviews`} variant="outline">
          {t("cta")}
        </Button>
      </div>
    </Section>
  );
}
