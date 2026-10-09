import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { getApprovedReviews } from "@/lib/reviews";

// Las reseñas aparecen cuando ella las aprueba; la página no puede quedar
// congelada con las del día en que se construyó.
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const t = await getTranslations("reviews_page");
  const reviews = await getApprovedReviews();

  return (
    <>
      <section className="bg-gradient-to-br from-champagne-light to-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-cafe mb-4">
            {t("title")}
          </h1>
          <p className="text-text-light text-lg max-w-2xl">{t("intro")}</p>
        </div>
      </section>

      <Section bg="white">
        <div className="mx-auto max-w-2xl">
          <ReviewForm />
        </div>
      </Section>

      <Section bg="mushroom">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl font-bold text-cafe text-center mb-10">
          {t("list_title")}
        </h2>
        {reviews.length > 0 ? (
          <ReviewList reviews={reviews} />
        ) : (
          // Sin reseñas ficticias: mientras no haya ninguna, se invita a dejar la primera.
          <p className="text-center text-text-light max-w-md mx-auto">{t("empty")}</p>
        )}
      </Section>
    </>
  );
}
