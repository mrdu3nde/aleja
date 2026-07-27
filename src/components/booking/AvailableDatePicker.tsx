"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = {
  en: ["S", "M", "T", "W", "T", "F", "S"],
  es: ["D", "L", "M", "M", "J", "V", "S"],
};

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
};

const LABELS = {
  en: {
    pickService: "Choose a service first.",
    loading: "Checking availability...",
    none: "No openings this month.",
    tryNext: "Try",
    prevMonth: "Previous month",
    nextMonth: "Next month",
  },
  es: {
    pickService: "Elige primero un servicio.",
    loading: "Buscando disponibilidad...",
    none: "No hay cupos este mes.",
    tryNext: "Prueba",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
  },
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * A date picker that only offers days the studio can actually take.
 *
 * The native <input type="date"> cannot do this: HTML only supports a min and a
 * max, so Android happily offers every Sunday and every blocked holiday. The
 * open days come from the server, which alone knows the weekly hours, the days
 * off and what is already booked for a service of this length.
 */
export function AvailableDatePicker({
  service,
  value,
  onChange,
  lang = "en",
}: {
  service: string;
  value: string;
  onChange: (date: string) => void;
  lang?: "en" | "es";
}) {
  const t = LABELS[lang];
  const [month, setMonth] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const today = useMemo(() => iso(new Date()), []);

  useEffect(() => {
    if (!service) {
      setOpenDates(new Set());
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // Never offer a day in the past, even if the studio is open then.
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const from = iso(first) < today ? today : iso(first);
        const params = new URLSearchParams({ service, from, to: iso(last) });
        const res = await fetch(`/api/availability?${params}`).then((r) => r.json());
        if (!cancelled) setOpenDates(new Set<string>(res.dates ?? []));
      } catch {
        if (!cancelled) setOpenDates(new Set());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [service, month, today]);

  // Only judge a selected date against the month it belongs to. Browsing to
  // another month used to clear it, because that month's list naturally does
  // not contain it.
  const selectedInView =
    value.slice(0, 7) === `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (value && selectedInView && !loading && service && !openDates.has(value)) {
      onChange("");
    }
  }, [openDates, value, selectedInView, loading, service, onChange]);

  if (!service) {
    return (
      <p className="text-sm py-2" style={{ color: "var(--admin-muted, #8A7B6E)" }}>
        {t.pickService}
      </p>
    );
  }

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = new Date(year, monthIndex, 1).getDay();
  const cells: Array<string | null> = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(new Date(year, monthIndex, i + 1))),
  ];

  const canGoBack = iso(new Date(year, monthIndex, 1)) > today;

  return (
    <div
      className="rounded-2xl p-3"
      style={{ border: "1px solid var(--admin-border, #e5ddd4)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
          disabled={!canGoBack}
          aria-label={t.prevMonth}
          title={t.prevMonth}
          className="flex items-center justify-center h-10 w-10 rounded-xl cursor-pointer disabled:opacity-25 disabled:cursor-default"
          style={{
            border: "1px solid var(--admin-border, #e5ddd4)",
            color: "var(--admin-text, #3A2E26)",
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span
          className="text-sm font-semibold capitalize"
          style={{ color: "var(--admin-text, #3A2E26)" }}
        >
          {MONTHS[lang][monthIndex]} {year}
        </span>
        <button
          type="button"
          onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
          aria-label={t.nextMonth}
          title={t.nextMonth}
          className="flex items-center justify-center h-10 w-10 rounded-xl cursor-pointer"
          style={{
            border: "1px solid var(--admin-border, #e5ddd4)",
            color: "var(--admin-text, #3A2E26)",
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS[lang].map((d, i) => (
          <span
            key={i}
            className="text-[11px] font-semibold text-center py-1"
            style={{ color: "var(--admin-muted, #8A7B6E)" }}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const available = openDates.has(date);
          const selected = date === value;
          return (
            <button
              key={date}
              type="button"
              disabled={!available}
              onClick={() => onChange(date)}
              aria-label={date}
              className="aspect-square flex items-center justify-center rounded-lg text-sm transition-colors"
              style={
                selected
                  ? { backgroundColor: "#6B4E3D", color: "#fff", fontWeight: 600 }
                  : available
                    ? {
                        color: "var(--admin-text, #3A2E26)",
                        border: "1px solid #6B4E3D",
                        fontWeight: 600,
                        cursor: "pointer",
                      }
                    : {
                        // visible enough to read the date, plainly out of reach
                        color: "var(--admin-muted, #8A7B6E)",
                        opacity: 0.5,
                        cursor: "default",
                      }
              }
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-xs mt-2 text-center" style={{ color: "var(--admin-muted, #8A7B6E)" }}>
          {t.loading}
        </p>
      ) : openDates.size === 0 ? (
        <div className="mt-3 text-center">
          <p className="text-xs mb-2" style={{ color: "var(--admin-muted, #8A7B6E)" }}>
            {t.none}
          </p>
          <button
            type="button"
            onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
            className="text-sm font-medium underline cursor-pointer"
            style={{ color: "#6B4E3D" }}
          >
            {t.tryNext} {MONTHS[lang][(monthIndex + 1) % 12]} →
          </button>
        </div>
      ) : null}
    </div>
  );
}
