import { getLocale } from "next-intl/server";
import { getPageContent } from "@/lib/get-page-content";
import { brandImage } from "@/lib/brand-image";
import { getPublicServices } from "@/lib/services";
import { getGalleryPhotos } from "@/lib/gallery";
import { Hero } from "@/components/home/Hero";
import { TrustPillars } from "@/components/home/TrustPillars";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { AboutPreview } from "@/components/home/AboutPreview";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { BookingCTA } from "@/components/home/BookingCTA";

export default async function HomePage() {
  const locale = await getLocale();
  const [content, services, photos] = await Promise.all([
    getPageContent(locale),
    getPublicServices(),
    getGalleryPhotos(),
  ]);

  const logo = brandImage(content);

  return (
    <>
      <Hero content={content} brandLogo={logo} />
      <TrustPillars content={content} />
      <FeaturedServices content={content} services={services} />
      <AboutPreview content={content} brandLogo={logo} />
      <GalleryPreview photos={photos} />
      <Testimonials />
      <BookingCTA content={content} />
    </>
  );
}
