import { getLocale } from "next-intl/server";
import { getPageContent } from "@/lib/get-page-content";
import { Hero } from "@/components/home/Hero";
import { TrustPillars } from "@/components/home/TrustPillars";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { AboutPreview } from "@/components/home/AboutPreview";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { BookingCTA } from "@/components/home/BookingCTA";

export default async function HomePage() {
  const locale = await getLocale();
  const content = await getPageContent(locale);

  return (
    <>
      <Hero content={content} />
      <TrustPillars content={content} />
      <FeaturedServices content={content} />
      <AboutPreview content={content} />
      <GalleryPreview />
      <Testimonials />
      <BookingCTA content={content} />
    </>
  );
}
