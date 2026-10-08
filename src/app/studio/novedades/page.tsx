"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Compass, Eye, Gift } from "lucide-react";
import { RELEASES, recordView } from "@/lib/novedades";
import { startTour } from "@/components/admin/Tour";

/**
 * Novedades: todo lo que ha cambiado en la plataforma, con su fecha, y quién
 * lo vio. Ella lo consulta para recordar qué hay nuevo; quien la ayuda, para
 * saber si ya lo vio (y en qué dispositivo) y si hizo el tour.
 */

type View = { releaseId: string; event: string; device: string | null; createdAt: string };
type Tour = {
  id: string;
  device: string | null;
  lastStep: number;
  totalSteps: number;
  startedAt: string;
  finishedAt: string | null;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-10-08" → "8 de octubre de 2026" (sin zona horaria: es un día). */
function longDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Un momento exacto, en la hora de quien mira: "8 oct, 10:32 a. m.". */
function moment(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit" });
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time}`;
}

const EVENT_LABEL: Record<string, string> = {
  visto: "Lo vio",
  entendido: "Tocó \"Entendido\"",
  historial: "Abrió el historial",
};

export default function NovedadesPage() {
  const [views, setViews] = useState<View[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Abrir el historial también cuenta como haber visto lo último. Se
    // registra antes de leer, para que la lista ya lo incluya.
    recordView(RELEASES[0].id, "historial")
      .then(() => fetch("/api/studio/novedades"))
      .then((r) => (r.ok ? r.json() : { views: [], tours: [] }))
      .then((d: { views: View[]; tours: Tour[] }) => {
        setViews(d.views);
        setTours(d.tours);
      })
      .finally(() => setLoaded(true));
  }, []);

  /** La primera vez de cada evento por dispositivo: "Lo vio · iPhone de Ale · 8 oct". */
  const viewsFor = (releaseId: string) => {
    const firsts = new Map<string, View>();
    for (const v of views) {
      if (v.releaseId !== releaseId) continue;
      const key = `${v.event}|${v.device ?? ""}`;
      if (!firsts.has(key)) firsts.set(key, v);
    }
    return [...firsts.values()];
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
          <Gift className="h-6 w-6" />
          Novedades
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
          Todo lo que ha cambiado en tu plataforma, de lo más nuevo a lo más antiguo.
        </p>
      </div>

      {/* El tour, arriba: es lo primero que conviene tener a mano. */}
      <section
        className="mb-8 rounded-2xl p-5"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid #C2A26B" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <Compass className="h-5 w-5" /> Tour guiado
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
              Un recorrido paso a paso por tu panel. Puedes repetirlo cuando quieras.
            </p>
          </div>
          <button
            onClick={startTour}
            className="shrink-0 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] cursor-pointer"
          >
            Hacer el tour
          </button>
        </div>
        {loaded && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {tours.length === 0 ? (
              <li style={{ color: "var(--admin-muted)" }}>Todavía nadie lo ha hecho.</li>
            ) : (
              tours.slice(0, 5).map((t) => (
                <li key={t.id} className="flex flex-wrap gap-x-2" style={{ color: "var(--admin-text)" }}>
                  <span style={{ color: t.finishedAt ? "#16a34a" : "#B45309" }}>
                    {t.finishedAt ? "Lo terminó" : `Llegó al paso ${t.lastStep} de ${t.totalSteps}`}
                  </span>
                  <span style={{ color: "var(--admin-muted)" }}>
                    · {t.device ?? "dispositivo sin nombre"} · {moment(t.finishedAt ?? t.startedAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {/* Línea de tiempo */}
      <ol className="relative space-y-8 pl-6" style={{ borderLeft: "1px solid var(--admin-border)" }}>
        {RELEASES.map((r, ri) => {
          const seen = viewsFor(r.id);
          return (
            <li key={r.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[31px] top-1 h-3 w-3 rounded-full"
                style={{ backgroundColor: ri === 0 ? "#C2A26B" : "var(--admin-border)", boxShadow: "0 0 0 4px var(--admin-bg)" }}
              />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ri === 0 ? "#A3844F" : "var(--admin-muted)" }}>
                {longDay(r.date)}
                {ri === 0 && " · lo más nuevo"}
              </p>
              <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
                {r.title}
              </h2>

              <ul className="mt-3 space-y-2">
                {r.items.map((item) => {
                  const inner = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="block text-sm" style={{ color: "var(--admin-muted)" }}>
                          {item.text}
                        </span>
                      </span>
                      <ChevronRight size={18} className="mt-0.5 shrink-0" style={{ color: "var(--admin-muted)" }} />
                    </>
                  );
                  const style = { backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" };
                  return (
                    <li key={item.title}>
                      {item.action === "tour" ? (
                        <button onClick={startTour} className="w-full text-left flex items-start gap-3 rounded-xl p-3 cursor-pointer" style={style}>
                          {inner}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          prefetch={false}
                          target={item.href.startsWith("/studio") ? undefined : "_blank"}
                          className="flex items-start gap-3 rounded-xl p-3"
                          style={style}
                        >
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Quién lo vio: sólo existe desde que hay registro (octubre 2026). */}
              {loaded && seen.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--admin-muted)" }}>
                  {seen.map((v) => (
                    <li key={`${v.event}-${v.device}-${v.createdAt}`} className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      {EVENT_LABEL[v.event] ?? v.event} · {v.device ?? "dispositivo sin nombre"} · {moment(v.createdAt)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
