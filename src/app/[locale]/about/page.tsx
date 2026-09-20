import { getLocale } from "next-intl/server";
import { getPageContent } from "@/lib/get-page-content";
import { brandImage } from "@/lib/brand-image";
import { AboutClient } from "./AboutClient";

export default async function AboutPage() {
  const locale = await getLocale();
  const content = await getPageContent(locale);
  // Se resuelve aquí, en el servidor, porque hay que mirar el disco.
  return <AboutClient content={content} brandLogo={brandImage(content)} />;
}
