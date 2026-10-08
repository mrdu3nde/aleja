import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { Wordmark } from "@/components/ui/Wordmark";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { getGalleryPhotos } from "@/lib/gallery";

// Las fotos cambian cuando ella sube una; la página no puede quedar congelada
// con las del día en que se construyó.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const t = await getTranslations("gallery_page");
  const photos = await getGalleryPhotos();

  return (
    <>
      <section className="bg-gradient-to-br from-champagne-light to-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-cafe mb-4">
            {t("title")}
          </h1>
          <p className="text-text-light text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
      </section>

      <Section bg="white">
        {photos.length > 0 ? (
          <GalleryGrid photos={photos} />
        ) : (
          // Ella pidió quitar las fotos de muestra y subir las suyas poco a
          // poco. Mientras no haya ninguna, la página lo dice con elegancia.
          <div className="py-12 flex flex-col items-center text-center">
            <Wordmark size="lg" />
            <span className="mt-6 h-px w-16 bg-gold/70" aria-hidden />
            <p className="mt-6 font-[family-name:var(--font-heading)] text-xl text-cafe">
              {t("empty_title")}
            </p>
            <p className="mt-3 text-text-light max-w-md">{t("empty_text")}</p>
          </div>
        )}
      </Section>
    </>
  );
}
