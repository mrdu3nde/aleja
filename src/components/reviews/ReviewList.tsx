import { Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { PublicReview } from "@/lib/reviews";

export function Stars({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={className}
          style={{ color: "var(--color-gold)", fill: n <= rating ? "var(--color-gold)" : "transparent" }}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {reviews.map((r) => (
        <Card key={r.id} className="h-full flex flex-col">
          <Stars rating={r.rating} />
          <p className="mt-4 text-text-dark leading-relaxed flex-1 italic whitespace-pre-line">
            &ldquo;{r.comment}&rdquo;
          </p>
          <p className="mt-5 font-semibold text-text-dark">{r.name}</p>
        </Card>
      ))}
    </div>
  );
}
