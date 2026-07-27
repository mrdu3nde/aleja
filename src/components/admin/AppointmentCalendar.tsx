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

/** First letter of the status, so meaning is not carried by colour alone. */
const statusInitial: Record<string, string> = {
  pending: "P",
  confirmed: "C",
  completed: "✓",
  cancelled: "×",
};

export function AppointmentCalendar({
  month,
  appointments,
  onMonthChange,
  onSelect,
  loading,
  hours,
}: {
  month: Date;
  appointments: Appointment[];
  onMonthChange: (next: Date) => void;
  onSelect: (id: string) => void;
  loading?: boolean;
  /** Opening hours, so closed days read as closed rather than merely empty. */
  hours?: OpeningHours | null;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const today = isoDay(new Date());

  // group appointments by their preferredDate
  const byDay = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    const key = apt.preferredDate as string | null;
    if (!key) continue;
    const list = byDay.get(key) ?? [];
    list.push(apt);
    byDay.set(key, list);
  }

  const cells: Array<string | null> = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoDay(new Date(year, monthIndex, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const undated = appointments.filter((a) => !a.preferredDate);

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold capitalize" style={{ color: "var(--admin-text)" }}>
            {month.toLocaleDateString("es-US", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
            style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          >
            Hoy
          </button>
        </div>

        <button
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid — below ~640px seven columns squeeze names into 2-3 letters, so the
          grid keeps a minimum width and scrolls sideways instead of collapsing. */}
      <div className="overflow-x-auto -mx-1 px-1">
      <div
        className="rounded-2xl overflow-hidden min-w-[560px]"
        style={{ border: "1px solid var(--admin-border)", backgroundColor: "var(--admin-card)" }}
      >
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--admin-muted)", borderBottom: "1px solid var(--admin-border)" }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const items = day ? byDay.get(day) ?? [] : [];
            const isToday = day === today;
            const opening = day ? openingFor(day, hours ?? null) : null;
            const closed = opening !== null && !opening.open;
            return (
              <div
                key={i}
                className="p-1.5 min-h-[104px]"
                title={
                  closed && opening && !opening.open
                    ? opening.reason
                    : opening && opening.open && hours
                      ? `${formatTime12(toHHMM(opening.startMinutes))} – ${formatTime12(toHHMM(opening.endMinutes))}`
                      : undefined
                }
                style={{
                  borderBottom: "1px solid var(--admin-border)",
                  borderRight: (i + 1) % 7 === 0 ? "none" : "1px solid var(--admin-border)",
                  backgroundColor: !day ? "var(--admin-filter-bg)" : "transparent",
                  // Diagonal hatching rather than a dimmer shade: a closed day
                  // has to be unmistakable at a glance, and lowering the opacity
                  // of the whole cell made its own label unreadable.
                  backgroundImage: closed ? CLOSED_HATCH : undefined,
                }}
              >
                {day && (
                  <>
                    {/* The day number and its bookings fade out on a closed day
                        so it reads as unavailable. The label sits outside the
                        fade, or it would be the least legible thing in the cell. */}
                    <div
                      className="text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                      style={
                        isToday
                          ? { backgroundColor: "#6B4E3D", color: "#fff" }
                          : closed
                            ? { color: "var(--admin-muted)", opacity: 0.45 }
                            : { color: "var(--admin-text)" }
                      }
                    >
                      {Number(day.slice(8))}
                    </div>
                    {closed && opening && !opening.open && (
                      <p
                        className="text-[11px] font-medium truncate mb-1"
                        style={{ color: "var(--admin-muted)" }}
                      >
                        {opening.reason}
                      </p>
                    )}
                    <div
                      className="flex flex-col gap-1"
                      style={closed ? { opacity: 0.45 } : undefined}
                    >
                      {items.slice(0, 3).map((apt) => {
                        const status = (apt.status as string) ?? "pending";
                        const depositPending =
                          apt.depositRequired !== false && apt.depositStatus !== "received";
                        return (
                          <button
                            key={apt.id as string}
                            onClick={() => onSelect(apt.id as string)}
                            aria-label={`${apt.clientName} — ${apt.service}, ${STATUS_LABELS[status] ?? status}${depositPending ? ", falta depósito" : ""}`}
                            className="w-full text-left px-1.5 rounded-md text-[11px] leading-tight cursor-pointer truncate flex items-center gap-1"
                            style={{
                              backgroundColor: `${statusColor[status] ?? "#9CA3AF"}22`,
                              color: "var(--admin-text)",
                              borderLeft: `3px solid ${statusColor[status] ?? "#9CA3AF"}`,
                              minHeight: 30,
                            }}
                          >
                            <span
                              className="shrink-0 font-bold"
                              style={{ color: statusColor[status] ?? "#9CA3AF" }}
                              aria-hidden="true"
                            >
                              {statusInitial[status] ?? "?"}
                            </span>
                            {depositPending && (
                              <DollarSign className="h-2.5 w-2.5 shrink-0" style={{ color: "#F59E0B" }} />
                            )}
                            <span className="truncate">{apt.clientName as string}</span>
                          </button>
                        );
                      })}
                      {items.length > 3 && (
                        <span className="text-[11px] px-1.5" style={{ color: "var(--admin-muted)" }}>
                          +{items.length - 3} más
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
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
        {hours && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 h-4 rounded-sm"
              style={{ border: "1px solid var(--admin-border)", backgroundImage: CLOSED_HATCH }}
            />
            Cerrado
          </span>
        )}
      </div>

      {loading && (
        <p className="text-sm mt-3" style={{ color: "var(--admin-muted)" }}>
          Cargando...
        </p>
      )}

      {/* Appointments with no date can never appear on a calendar — surface them */}
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
