import { getLocale } from "next-intl/server";
import { getPageContent } from "@/lib/get-page-content";
import { getPublicServices } from "@/lib/services";
import { Hero } from "@/components/home/Hero";
import { TrustPillars } from "@/components/home/TrustPillars";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { AboutPreview } from "@/components/home/AboutPreview";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { BookingCTA } from "@/components/home/BookingCTA";

export default async function HomePage() {
  const locale = await getLocale();
  const [content, services] = await Promise.all([
    getPageContent(locale),
    getPublicServices(),
  ]);

  return (
    <>
      <Hero content={content} />
      <TrustPillars content={content} />
      <FeaturedServices content={content} services={services} />
      <AboutPreview content={content} />
      <GalleryPreview />
      <Testimonials />
      <BookingCTA content={content} />
    </>
  );
}
