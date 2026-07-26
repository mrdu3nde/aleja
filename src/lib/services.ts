import { prisma } from "./prisma";

export type PublicService = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  imageUrl: string | null;
  icon: string | null;
};

/**
 * Services shown on the public site, in the order set in the studio.
 * Returns an empty list rather than throwing so a database hiccup degrades the
 * section instead of taking the whole page down.
 */
export async function getPublicServices(): Promise<PublicService[]> {
  try {
    const rows = await prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      price: s.price != null ? Number(s.price) : null,
      imageUrl: s.imageUrl,
      icon: s.icon,
    }));
  } catch {
    return [];
  }
}

/**
 * Turn whatever a form submitted into the canonical service.
 *
 * The public site posts the slug ("hair") while the studio posts the label
 * ("Hair Services"), and older rows hold either. Accepting both keeps one
 * vocabulary in the database from here on, and lets the fixed price be applied
 * to website bookings too — without it their Payment section had no price and
 * therefore no balance.
 */
export async function resolveService(
  submitted: string,
): Promise<{ name: string; price: number | null } | null> {
  const value = submitted.trim();
  if (!value) return null;

  try {
    const match = await prisma.service.findFirst({
      where: {
        OR: [
          { slug: { equals: value, mode: "insensitive" } },
          { name: { equals: value, mode: "insensitive" } },
        ],
      },
    });
    if (!match) return null;
    return { name: match.name, price: match.price != null ? Number(match.price) : null };
  } catch {
    return null;
  }
}
