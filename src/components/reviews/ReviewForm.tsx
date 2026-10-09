"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Nombre, de 1 a 5 estrellas y el comentario. Se publica cuando ella la aprueba. */
export function ReviewForm() {
  const t = useTranslations("reviews_page");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      name: name.trim().length < 2,
      rating: rating < 1,
      comment: comment.trim().length < 10,
    };
    setErrors(next);
    if (next.name || next.rating || next.comment) return;

    setState("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comment, locale: locale === "es" ? "es" : "en", website }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-champagne-light mb-4">
          <CheckCircle className="h-9 w-9 text-cafe" />
        </div>
        <h2 className="text-2xl font-semibold text-cafe mb-2 font-[family-name:var(--font-heading)]">
          {t("success_title")}
        </h2>
        <p className="text-text-light">{t("success_text")}</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-mushroom/40 bg-white px-4 py-3 text-text-dark placeholder:text-text-muted focus:border-cafe focus:ring-1 focus:ring-cafe outline-none transition-colors";
  const shown = hover || rating;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="review-name" className="block text-sm font-medium text-text-dark mb-1.5">
          {t("name")}
        </label>
        <input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder={t("name_placeholder")}
          className={inputClass}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{t("error_name")}</p>}
      </div>

      <div>
        <p className="block text-sm font-medium text-text-dark mb-1.5">{t("rating")}</p>
        <div className="flex gap-1" role="radiogroup" aria-label={t("rating")} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t("star", { count: n })}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="p-1 cursor-pointer"
            >
              <Star
                className="h-8 w-8 transition-colors"
                style={{ color: "var(--color-gold)", fill: n <= shown ? "var(--color-gold)" : "transparent" }}
              />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-red-600">{t("error_rating")}</p>}
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-text-dark mb-1.5">
          {t("comment")}
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          maxLength={1500}
          placeholder={t("comment_placeholder")}
          className={inputClass}
        />
        {errors.comment && <p className="mt-1 text-xs text-red-600">{t("error_comment")}</p>}
      </div>

      {/* Campo trampa para bots: invisible y fuera del orden de tabulación. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {state === "error" && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{t("error")}</span>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("submitting")}
          </span>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
