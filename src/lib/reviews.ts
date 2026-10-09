import { z } from "zod";
import { prisma } from "./prisma";

export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export const reviewSchema = z.object({
  name: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1500),
  locale: z.enum(["es", "en"]).default("es"),
  /** Campo trampa: invisible para las personas, los bots lo llenan. */
  website: z.string().max(200).optional(),
});

/** Sólo las aprobadas por ella. Vacío si la base falla: la sección invita a dejar la primera. */
export async function getApprovedReviews(limit = 50): Promise<PublicReview[]> {
  try {
    const rows = await prisma.review.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
