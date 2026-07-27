"use client";

import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { isoDay, STATUS_LABELS } from "@/lib/dates";
import { openingFor, formatTime12, toHHMM, type OpeningHours } from "@/lib/time";

type Appointment = Record<string, unknown>;

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Diagonal hatching marks a day the studio does not work. */
const CLOSED_HATCH = "repeating-linear-gradient(45deg, transparent, transparent 5px, color-mix(in srgb, var(--admin-muted) 22%, transparent) 5px, color-mix(in srgb, var(--admin-muted) 22%, transparent) 6px)";

const statusColor: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#2563EB",
  completed: "#10B981",
  cancelled: "#9CA3AF",
};

const statusInitial: Record<string, string> = {
  pending: "P",
  confirmed: "C",
  completed: "✓",
  cancelled: "×",
};

/** Sunday of the week the given date falls in. */
export function startOfWeek(d: Date) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function hourLabel(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12} ${period}`;
}

/** "15:30" -> 15. Anything unparseable is treated as untimed. */
function hourOf(time: unknown): number | null {
  if (typeof time !== "string") return null;
  const h = Number(time.split(":")[0]);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
}

export function AppointmentWeek({
  weekStart,
  appointments,
  onWeekChange,
  onSelect,
  loading,
  hours,
}: {
  weekStart: Date;
  appointments: Appointment[];
  onWeekChange: (next: Date) => void;
  onSelect: (id: string) => void;
  loading?: boolean;
  hours?: OpeningHours | null;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const dayKeys = days.map(isoDay);
  const today = isoDay(new Date());

  const inWeek = appointments.filter((a) =>
    dayKeys.includes((a.preferredDate as string) ?? ""),
  );

  // Only render hours that actually hold something, padded to a normal working
  // day, so the grid never becomes a wall of empty 3 AM rows.
  const bookedHours = inWeek
    .map((a) => hourOf(a.preferredTime))
    .filter((h): h is number => h !== null);
  const minHour = Math.min(9, ...bookedHours);
  const maxHour = Math.max(19, ...bookedHours);
  const hourRange = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  // day -> hour -> appointments
  const slots = new Map<string, Map<number | "none", Appointment[]>>();
  for (const key of dayKeys) slots.set(key, new Map());
  for (const apt of inWeek) {
    const key = apt.preferredDate as string;
    const h = hourOf(apt.preferredTime);
    const dayMap = slots.get(key)!;
    const bucket = h === null ? "none" : h;
    dayMap.set(bucket, [...(dayMap.get(bucket) ?? []), apt]);
  }

  const anyUntimed = dayKeys.some((k) => (slots.get(k)?.get("none")?.length ?? 0) > 0);
  const undated = appointments.filter((a) => !a.preferredDate);

  const rangeLabel = () => {
    const end = days[6];
    const sameMonth = weekStart.getMonth() === end.getMonth();
    const fmt = (d: Date, withMonth: boolean) =>
      d.toLocaleDateString("es-US", withMonth ? { month: "short", day: "numeric" } : { day: "numeric" });
    return `${fmt(weekStart, true)} – ${fmt(end, !sameMonth)}, ${end.getFullYear()}`;
  };

  const Chip = ({ apt }: { apt: Appointment }) => {
    const status = (apt.status as string) ?? "pending";
    const depositPending = apt.depositRequired !== false && apt.depositStatus !== "received";
    return (
      <button
        onClick={() => onSelect(apt.id as string)}
        aria-label={`${apt.clientName} — ${apt.service}, ${STATUS_LABELS[status] ?? status}${depositPending ? ", falta depósito" : ""}`}
        className="w-full text-left px-1.5 py-1 rounded-md text-[11px] leading-tight cursor-pointer"
        style={{
          backgroundColor: `${statusColor[status] ?? "#9CA3AF"}22`,
          color: "var(--admin-text)",
          borderLeft: `3px solid ${statusColor[status] ?? "#9CA3AF"}`,
          minHeight: 32,
        }}
      >
        <span className="flex items-center gap-1">
          <span className="shrink-0 font-bold" style={{ color: statusColor[status] ?? "#9CA3AF" }} aria-hidden="true">
            {statusInitial[status] ?? "?"}
          </span>
          {depositPending && <DollarSign className="h-2.5 w-2.5 shrink-0" style={{ color: "#F59E0B" }} />}
          <span className="truncate font-medium">{apt.clientName as string}</span>
        </span>
        <span className="block truncate" style={{ color: "var(--admin-muted)" }}>
          {apt.service as string}
        </span>
      </button>
    );
  };

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const p = new Date(weekStart);
            p.setDate(p.getDate() - 7);
            onWeekChange(p);
          }}
          className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
            {rangeLabel()}
          </h2>
          <button
            onClick={() => onWeekChange(startOfWeek(new Date()))}
            className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
            style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          >
            Esta semana
          </button>
        </div>

        <button
          onClick={() => {
            const n = new Date(weekStart);
            n.setDate(n.getDate() + 7);
            onWeekChange(n);
          }}
          className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          aria-label="Semana siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Seven day columns plus an hour gutter never fit a phone, so the grid
          keeps a minimum width and scrolls sideways. */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div
          className="rounded-2xl overflow-hidden min-w-[680px]"
          style={{ border: "1px solid var(--admin-border)", backgroundColor: "var(--admin-card)" }}
        >
          {/* Day header */}
          <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
            <div style={{ borderBottom: "1px solid var(--admin-border)" }} />
            {days.map((d, i) => {
              const key = dayKeys[i];
              const isToday = key === today;
              const opening = openingFor(key, hours ?? null);
              return (
                <div
                  key={key}
                  className="px-2 py-2 text-center"
                  title={
                    opening.open
                      ? hours
                        ? `${formatTime12(toHHMM(opening.startMinutes))} – ${formatTime12(toHHMM(opening.endMinutes))}`
                        : undefined
                      : opening.reason
                  }
                  style={{
                    borderBottom: "1px solid var(--admin-border)",
                    borderLeft: "1px solid var(--admin-border)",
                    backgroundColor: isToday ? "rgba(107,78,61,0.08)" : "transparent",
                    backgroundImage: opening.open ? undefined : CLOSED_HATCH,
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--admin-muted)", opacity: opening.open ? 1 : 0.45 }}
                  >
                    {WEEKDAYS[d.getDay()]}
                  </p>
                  <p
                    className="text-sm font-bold mt-0.5 w-6 h-6 mx-auto flex items-center justify-center rounded-full"
                    style={
                      isToday
                        ? { backgroundColor: "#6B4E3D", color: "#fff" }
                        : opening.open
                          ? { color: "var(--admin-text)" }
                          : { color: "var(--admin-muted)", opacity: 0.45 }
                    }
                  >
                    {d.getDate()}
                  </p>
                  {!opening.open && (
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--admin-muted)" }}>
                      {opening.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Untimed row — a date but no hour has to live somewhere visible */}
          {anyUntimed && (
            <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div
                className="px-1 py-2 text-[10px] font-semibold uppercase text-right"
                style={{ color: "var(--admin-muted)", borderBottom: "1px solid var(--admin-border)" }}
              >
                Sin hora
              </div>
              {dayKeys.map((key) => (
                <div
                  key={key}
                  className="p-1 space-y-1"
                  style={{
                    borderBottom: "1px solid var(--admin-border)",
                    borderLeft: "1px solid var(--admin-border)",
                    minHeight: 44,
                  }}
                >
                  {(slots.get(key)?.get("none") ?? []).map((apt) => (
                    <Chip key={apt.id as string} apt={apt} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Hour rows */}
          {hourRange.map((h, rowIndex) => (
            <div key={h} className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div
                className="px-1 py-1 text-[10px] font-medium text-right"
                style={{
                  color: "var(--admin-muted)",
                  borderBottom: rowIndex === hourRange.length - 1 ? "none" : "1px solid var(--admin-border)",
                }}
              >
                {hourLabel(h)}
              </div>
              {dayKeys.map((key) => {
                const items = slots.get(key)?.get(h) ?? [];
                return (
                  <div
                    key={key}
                    className="p-1 space-y-1"
                    style={{
                      borderBottom: rowIndex === hourRange.length - 1 ? "none" : "1px solid var(--admin-border)",
                      borderLeft: "1px solid var(--admin-border)",
                      backgroundColor: key === today ? "rgba(107,78,61,0.04)" : "transparent",
                      backgroundImage: openingFor(key, hours ?? null).open ? undefined : CLOSED_HATCH,
                      minHeight: 44,
                    }}
                  >
                    {items.map((apt) => (
                      <Chip key={apt.id as string} apt={apt} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs" style={{ color: "var(--admin-muted)" }}>
        {Object.entries(statusColor).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {statusInitial[status]}
            </span>
            {STATUS_LABELS[status] ?? status}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <DollarSign className="h-3 w-3" style={{ color: "#F59E0B" }} />
          Falta depósito
        </span>
      </div>

      {loading && (
        <p className="text-sm mt-3" style={{ color: "var(--admin-muted)" }}>
          Cargando...
        </p>
      )}

      {undated.length > 0 && (
        <div
          className="mt-6 rounded-2xl p-4"
          style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
            Sin fecha ({undated.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {undated.map((apt) => (
              <button
                key={apt.id as string}
                onClick={() => onSelect(apt.id as string)}
                className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
              >
                {apt.clientName as string} · {apt.service as string}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
