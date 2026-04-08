import { prisma } from "./prisma";

// Editable content keys organized by section
export const contentSections = {
  hero: ["hero.headline", "hero.subheadline"],
  trust: [
    "trust.title",
    "trust.personalized",
    "trust.personalized_desc",
    "trust.quality",
    "trust.quality_desc",
    "trust.results",
    "trust.results_desc",
    "trust.experience",
    "trust.experience_desc",
  ],
  services: [
    "services_section.title",
    "services_section.subtitle",
    "services_section.hair.title",
    "services_section.hair.description",
    "services_section.nails.title",
    "services_section.nails.description",
    "services_section.brows.title",
    "services_section.brows.description",
    "services_section.lashes.title",
    "services_section.lashes.description",
    "services_section.facial.title",
    "services_section.facial.description",
    "services_section.special.title",
    "services_section.special.description",
  ],
  about: [
    "about_preview.title",
    "about_preview.text",
    "about_page.title",
    "about_page.intro",
    "about_page.story",
    "about_page.philosophy",
    "about_page.commitment",
  ],
  booking: [
    "booking_cta.title",
    "booking_cta.subtitle",
  ],
} as const;

export const sectionLabels: Record<string, string> = {
  hero: "Hero Section",
  trust: "Trust Pillars",
  services: "Services",
  about: "About",
  booking: "Booking CTA",
};

// Get a readable label from a content key
export function keyToLabel(key: string): string {
  const parts = key.split(".");
  const last = parts[parts.length - 1];
  return last
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Get all editable content for a locale, falling back to message file defaults
export async function getContent(locale: string) {
  const rows = await prisma.content.findMany({
    where: { locale },
  });
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

// Get a single content value with fallback
export async function getContentValue(
  key: string,
  locale: string,
  fallback: string,
): Promise<string> {
  const row = await prisma.content.findUnique({
    where: { key_locale: { key, locale } },
  });
  return row?.value ?? fallback;
}
