"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { TOUR_STEPS } from "@/lib/tour-steps";

/**
 * El tour guiado, como los de los programas profesionales: oscurece la
 * pantalla, ilumina el botón del que habla y explica qué hacer. Va de una
 * pantalla a otra solo.
 *
 * El paso actual vive en sessionStorage, así sobrevive a la navegación entre
 * páginas y a una recarga, pero no queda "pegado" para la próxima vez.
 */

const KEY = "studio-tour";
const listeners = new Set<() => void>();

function readStep(): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeStep(step: number | null) {
  try {
    if (step === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(step));
  } catch {
    // Sin almacenamiento el tour igual funciona mientras no se recargue.
  }
  memory = step;
  listeners.forEach((l) => l());
}

// Copia en memoria por si sessionStorage no está disponible.
let memory: number | null = null;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => readStep() ?? memory;
const serverSnapshot = () => null;

/** Empieza el tour desde el primer paso. */
export function startTour() {
  writeStep(0);
}

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

function visible(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // Escondido o fuera de la pantalla (el menú lateral cerrado en el teléfono
  // está corrido a la izquierda): como si no estuviera.
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth ? el : null;
}

function findTarget(target?: string, phoneTarget?: string): HTMLElement | null {
  const pick = (name?: string) =>
    name ? visible(document.querySelector<HTMLElement>(`[data-tour="${name}"]`)) : null;
  return pick(target) ?? pick(phoneTarget);
}

/** La cita que se usa para enseñar: la más reciente que no esté cancelada. */
async function resolveAppointmentPath(): Promise<string> {
  try {
    const res = await fetch("/api/studio/appointments?scope=all&limit=20");
    const d = (await res.json()) as { data?: { id: string; status: string }[] };
    const apt = d.data?.find((a) => a.status !== "cancelled");
    return apt ? `/studio/appointments/${apt.id}` : "/studio/appointments";
  } catch {
    return "/studio/appointments";
  }
}

export function Tour() {
  const step = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const router = useRouter();
  const pathname = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const [aptPath, setAptPath] = useState<string | null>(null);
  const [isPhone, setIsPhone] = useState(false);
  const [cardH, setCardH] = useState(0);
  // Mide la tarjeta al montarse o cambiar de paso, para ubicarla sin taparse.
  const cardRef = useCallback((el: HTMLDivElement | null) => {
    if (el) setCardH(el.getBoundingClientRect().height);
  }, []);

  const current = step !== null ? TOUR_STEPS[step] : undefined;
  const close = useCallback(() => writeStep(null), []);
  const go = useCallback(
    (to: number) => (to < 0 || to >= TOUR_STEPS.length ? writeStep(null) : writeStep(to)),
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 1. Llevar a la pantalla del paso.
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    (async () => {
      let path = current.path;
      if (path === "cita") {
        path = aptPath ?? (await resolveAppointmentPath());
        if (!cancelled && !aptPath) setAptPath(path);
      }
      if (cancelled) return;
      if (pathname !== path) {
        setReady(false);
        router.push(path);
      } else {
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [current, pathname, router, aptPath]);

  // 2. Buscar el elemento y seguirlo si la página se mueve. Un intervalo y no
  //    requestAnimationFrame: el navegador pausa los frames cuando la ventana
  //    no está al frente, y el foco se quedaba en el lugar viejo.
  useEffect(() => {
    if (!current || !ready) return;
    let tries = 0;
    let scrolled = false;
    const measure = () => {
      const el = findTarget(current.target, current.phoneTarget);
      if (el) {
        if (!scrolled) {
          const r0 = el.getBoundingClientRect();
          if (window.matchMedia("(max-width: 639px)").matches) {
            // En el teléfono la explicación sube desde abajo: el elemento
            // va arriba, justo bajo el botón del menú, para que no lo tape.
            window.scrollTo({ top: window.scrollY + r0.top - 88, behavior: "smooth" });
          } else {
            // Lo alto (un formulario) se alinea arriba; lo pequeño, al centro.
            el.scrollIntoView({ block: r0.height > window.innerHeight * 0.5 ? "start" : "center", behavior: "smooth" });
          }
          scrolled = true;
        }
        const r = el.getBoundingClientRect();
        setRect((prev) =>
          prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height },
        );
      } else if (++tries > 25) {
        // ~2.5 s sin aparecer: se explica sin foco.
        setRect(null);
      }
    };
    const timer = window.setInterval(measure, 100);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      setRect(null);
    };
  }, [current, ready]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(step + 1);
      else if (e.key === "ArrowLeft") go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go, close]);

  if (!current || step === null || pathname === "/studio/login") return null;

  const last = step === TOUR_STEPS.length - 1;
  const spot = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Dónde va la tarjeta: en el teléfono, abajo como hoja; en pantalla grande,
  // debajo (o encima) del elemento, o al centro si no hay foco.
  const CARD_W = 380;
  let cardStyle: React.CSSProperties;
  if (isPhone) {
    // Siempre abajo, como hoja: el elemento ya se subió a la parte de arriba.
    // Sólo si no se pudo subir (está al final de la página) va arriba.
    const spotLow = spot && spot.top > window.innerHeight * 0.5;
    cardStyle = { left: 12, right: 12, ...(spotLow ? { top: 12 } : { bottom: 12 }) };
  } else if (spot && spot.height > window.innerHeight * 0.5) {
    // El elemento ocupa media pantalla o más: la tarjeta va a un lado, abajo.
    cardStyle = { right: 24, bottom: 24, width: CARD_W };
  } else if (spot) {
    // La altura real de la tarjeta (cambia con el texto de cada paso).
    const h = cardH || 240;
    const below = spot.top + spot.height + 12;
    const left = Math.min(Math.max(12, spot.left), window.innerWidth - CARD_W - 12);
    const roomRight = window.innerWidth - (spot.left + spot.width) - 24;
    if (below + h < window.innerHeight - 12) {
      cardStyle = { top: below, left, width: CARD_W };
    } else if (spot.top - h - 12 >= 12) {
      cardStyle = { top: spot.top - h - 12, left, width: CARD_W };
    } else if (roomRight >= CARD_W) {
      // Ni arriba ni abajo (pantalla baja): al costado del elemento.
      cardStyle = { top: Math.max(12, Math.min(spot.top, window.innerHeight - h - 12)), left: spot.left + spot.width + 24, width: CARD_W };
    } else if (spot.left - 24 >= CARD_W + 12) {
      cardStyle = { top: Math.max(12, Math.min(spot.top, window.innerHeight - h - 12)), left: spot.left - CARD_W - 24, width: CARD_W };
    } else {
      // Último recurso: abajo a la derecha, tapando lo menos posible.
      cardStyle = { right: 24, bottom: 24, width: CARD_W };
    }
  } else {
    cardStyle = { top: "50%", left: "50%", width: CARD_W, transform: "translate(-50%, -50%)" };
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={current.title} style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
      {/* Atrapa los toques fuera de la tarjeta: durante el tour no se navega por error. */}
      <div style={{ position: "absolute", inset: 0 }} onClick={(e) => e.stopPropagation()} />

      {spot ? (
        <div
          aria-hidden
          style={{
            position: "fixed",
            ...spot,
            borderRadius: 14,
            boxShadow: "0 0 0 9999px rgba(20,14,10,0.62), 0 0 0 2px #E6D3AC",
            transition: "all 0.25s ease",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundColor: "rgba(20,14,10,0.62)" }} />
      )}

      <div
        key={step}
        ref={cardRef}
        style={{
          position: "fixed",
          ...cardStyle,
          backgroundColor: "var(--admin-card)",
          color: "var(--admin-text)",
          border: "1px solid #C2A26B",
          borderRadius: 18,
          padding: 20,
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          paddingBottom: isPhone ? "calc(20px + env(safe-area-inset-bottom))" : 20,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#A3844F" }}>
            Tour · {step + 1} de {TOUR_STEPS.length}
          </p>
          <button
            onClick={close}
            aria-label="Salir del tour"
            className="-mt-1 -mr-1 rounded-lg p-1.5 cursor-pointer"
            style={{ color: "var(--admin-muted)" }}
          >
            <X size={18} />
          </button>
        </div>
        <h2 className="mt-1 text-lg font-semibold">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--admin-muted)" }}>
          {current.body}
        </p>

        {/* Puntitos de avance */}
        <div className="mt-4 flex gap-1.5" aria-hidden>
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                height: 6,
                width: i === step ? 18 : 6,
                borderRadius: 999,
                backgroundColor: i <= step ? "#C2A26B" : "var(--admin-border)",
                transition: "width 0.2s",
              }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer disabled:opacity-0"
            style={{ color: "var(--admin-text)", backgroundColor: "var(--admin-hover)" }}
          >
            <ChevronLeft size={16} /> Atrás
          </button>
          <button
            onClick={() => go(step + 1)}
            className="flex items-center gap-1 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] cursor-pointer"
          >
            {last ? "Terminar" : "Siguiente"} {!last && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
