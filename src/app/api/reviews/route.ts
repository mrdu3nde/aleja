import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/reviews";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { notifyOwner } from "@/lib/push";

/**
 * Público: una clienta deja su reseña. Queda "pending" hasta que ella la
 * aprueba en el panel, así que lo peor que puede hacer un bot es llenarle la
 * bandeja — y para eso está el límite por IP y el campo trampa.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`review:${clientKey(request)}`, 3, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "too_many" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const data = parsed.data;

  // Un bot llenó el campo invisible: se le contesta como si nada.
  if (data.website) return NextResponse.json({ success: true });

  try {
    const review = await prisma.review.create({
      data: { name: data.name, rating: data.rating, comment: data.comment, locale: data.locale },
    });
    after(() =>
      notifyOwner({
        title: `Nueva reseña: ${"★".repeat(review.rating)}`,
        body: `${review.name}: ${review.comment.slice(0, 100)}`,
        url: "/studio/reviews",
      }).catch(console.error),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review create error:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
