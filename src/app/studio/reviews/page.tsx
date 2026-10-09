"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, MessageSquareHeart, Star, Trash2 } from "lucide-react";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  locale: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
};

const STATUS: Record<Review["status"], { label: string; bg: string; fg: string }> = {
  pending: { label: "Nueva, sin publicar", bg: "#FFF4DB", fg: "#8A5A00" },
  approved: { label: "Publicada", bg: "#E5F4E8", fg: "#2F6B3A" },
  hidden: { label: "Oculta", bg: "var(--admin-hover)", fg: "var(--admin-muted)" },
};

function when(iso: string) {
  return new Date(iso).toLocaleDateString("es-US", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Las reseñas que dejan las clientas en "¡Cuéntanos tu experiencia!". Ninguna
 * sale en el sitio hasta que ella la publica aquí.
 */
export default function StudioReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/studio/reviews")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d: { data: Review[] }) => setReviews(d.data))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (id: string, status: Review["status"]) => {
    setReviews((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/studio/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const remove = async (id: string) => {
    setConfirmId(null);
    setReviews((list) => list.filter((r) => r.id !== id));
    await fetch(`/api/studio/reviews/${id}`, { method: "DELETE" });
  };

  const pending = reviews.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
          <MessageSquareHeart className="h-6 w-6" />
          Reseñas
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
          {reviews.length === 0
            ? "Todavía no hay reseñas. Cuando una clienta deje la suya, te llega un aviso y aparece aquí."
            : pending > 0
              ? `Tienes ${pending === 1 ? "1 reseña nueva" : `${pending} reseñas nuevas`}. Ninguna sale en la página hasta que tocas "Publicar".`
              : "Sólo las publicadas se ven en la página."}
        </p>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>Cargando…</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const s = STATUS[r.status];
            return (
              <div
                key={r.id}
                className="rounded-2xl p-5"
                style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold" style={{ color: "var(--admin-text)" }}>{r.name}</span>
                    <span className="inline-flex" aria-label={`${r.rating} de 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className="h-4 w-4"
                          style={{ color: "#C2A26B", fill: n <= r.rating ? "#C2A26B" : "transparent" }}
                        />
                      ))}
                    </span>
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>
                    {s.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--admin-text)" }}>
                  {r.comment}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--admin-muted)" }}>
                  {when(r.createdAt)} · escrita en {r.locale === "en" ? "inglés" : "español"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status !== "approved" ? (
                    <button
                      onClick={() => setStatus(r.id, "approved")}
                      className="flex items-center gap-1.5 rounded-xl bg-[#6B4E3D] text-white px-3.5 py-2 text-sm font-medium cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      Publicar
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(r.id, "hidden")}
                      className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium cursor-pointer"
                      style={{ border: "1px solid var(--admin-input-border)", color: "var(--admin-text)" }}
                    >
                      <EyeOff className="h-4 w-4" />
                      Ocultar
                    </button>
                  )}
                  {confirmId === r.id ? (
                    <>
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded-xl bg-red-600 text-white px-3.5 py-2 text-sm font-medium cursor-pointer"
                      >
                        Sí, borrarla
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-xl px-3.5 py-2 text-sm cursor-pointer"
                        style={{ color: "var(--admin-muted)" }}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmId(r.id)}
                      className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm cursor-pointer"
                      style={{ color: "var(--admin-muted)" }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
