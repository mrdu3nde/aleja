import { getLocale } from "next-intl/server";
import { getPageContent } from "@/lib/get-page-content";
import { AboutClient } from "./AboutClient";

export default async function AboutPage() {
  const locale = await getLocale();
  const content = await getPageContent(locale);
  return <AboutClient content={content} />;
}
