"use client";

import Link from "next/link";
import { ChevronRight, Gift } from "lucide-react";
import { useNovedades } from "@/lib/novedades";

/**
 * La tarjeta "Lo nuevo" del inicio del panel. Sale hasta que ella toca
 * "Entendido"; después cada sección conserva su etiqueta "Nuevo" en el menú
 * hasta que la abre.
 */
export function NovedadesCard() {
  const { items, showCard, dismissCard } = useNovedades();
  if (!showCard) return null;

  return (
    <section
      className="mb-8 rounded-2xl p-5 sm:p-6"
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid #C2A26B",
        boxShadow: "0 0 0 4px rgba(194,162,107,0.12)",
      }}
    >
      <div className="flex items-center gap-3 mb-1">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgba(194,162,107,0.18)", color: "#A3844F" }}
        >
          <Gift size={18} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#A3844F" }}>
            Nuevo
          </p>
          <h2 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
            Tu plataforma se actualizó
          </h2>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--admin-muted)" }}>
        Hicimos lo que pediste en Mejoras. Toca cada punto para verlo.
      </p>

      <ul className="space-y-2">
        {items.map((item) => {
          const external = !item.href.startsWith("/studio");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                target={external ? "_blank" : undefined}
                prefetch={false}
                className="flex items-start gap-3 rounded-xl p-3 transition-colors"
                style={{ backgroundColor: "var(--admin-hover)", color: "var(--admin-text)" }}
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#C2A26B" }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="block text-sm" style={{ color: "var(--admin-muted)" }}>
                    {item.text}
                  </span>
                </span>
                <ChevronRight size={18} className="mt-1 shrink-0" style={{ color: "var(--admin-muted)" }} />
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        onClick={dismissCard}
        className="mt-4 rounded-xl bg-[#6B4E3D] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
      >
        Entendido
      </button>
    </section>
  );
}
