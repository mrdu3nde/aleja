"use client";

import { useEffect, useState } from "react";
import { formatTime12, humanDuration } from "@/lib/time";

type DaySlots = {
  closed: boolean;
  reason: string | null;
  slots: string[];
  durationMinutes: number;
};

type Labels = {
  pickService: string;
  pickDate: string;
  loading: string;
  closed: string;
  full: string;
  takes: (mins: string) => string;
};

const EN: Labels = {
  pickService: "Choose a service first.",
  pickDate: "Pick a date to see the times available.",
  loading: "Checking availability...",
  closed: "Closed that day — try another date.",
  full: "No times left that day. Try another date.",
  takes: (m) => `This service takes ${m}.`,
};

const ES: Labels = {
  pickService: "Elige primero un servicio.",
  pickDate: "Elige una fecha para ver los horarios disponibles.",
  loading: "Buscando horarios...",
  closed: "Ese día está cerrado — prueba con otra fecha.",
  full: "No quedan horarios ese día. Prueba con otra fecha.",
  takes: (m) => `Este servicio toma ${m}.`,
};

/**
 * Free start times for a service on a date.
 *
 * The list comes from the server, which is the only place that knows the
 * opening hours, the days off and what is already booked. Showing a slot the
 * server would reject is worse than showing none, so this never guesses.
 */
export function TimeSlotPicker({
  service,
  date,
  value,
  onChange,
  lang = "en",
}: {
  service: string;
  date: string;
  value: string;
  onChange: (time: string) => void;
  lang?: "en" | "es";
}) {
  const t = lang === "es" ? ES : EN;
  const [data, setData] = useState<DaySlots | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!service || !date) {
      setData(null);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ service, date });
        const res = await fetch(`/api/availability?${params}`).then((r) => r.json());
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [service, date]);

  // A slot that stops being valid must not stay selected.
  useEffect(() => {
    if (value && data && !data.slots.includes(value)) onChange("");
  }, [data, value, onChange]);

  const message = (text: string) => (
    <p className="text-sm py-2" style={{ color: "var(--admin-muted, #8A7B6E)" }}>
      {text}
    </p>
  );

  if (!service) return message(t.pickService);
  if (!date) return message(t.pickDate);
  if (loading) return message(t.loading);
  if (!data) return null;
  if (data.closed) return message(data.reason ? `${t.closed}` : t.closed);
  if (data.slots.length === 0) return message(t.full);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {data.slots.map((slot) => {
          const selected = slot === value;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              aria-pressed={selected}
              className="px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors"
              style={
                selected
                  ? { backgroundColor: "#6B4E3D", color: "#fff" }
                  : {
                      border: "1px solid #6B4E3D",
                      color: "var(--admin-text, #3A2E26)",
                    }
              }
            >
              {formatTime12(slot)}
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-2" style={{ color: "var(--admin-muted, #8A7B6E)" }}>
        {t.takes(humanDuration(data.durationMinutes))}
      </p>
    </div>
  );
}
