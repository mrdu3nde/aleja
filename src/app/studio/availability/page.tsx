"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Save, CheckCircle, Plus, X, CalendarOff } from "lucide-react";
import { toHHMM, toMinutes } from "@/lib/time";

type Day = {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  active: boolean;
};

type Blocked = { date: string; reason: string | null };

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const inputStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--admin-input-border)",
  backgroundColor: "var(--admin-input)",
  padding: "8px 10px",
  fontSize: 14,
  color: "var(--admin-text)",
  outline: "none",
};

export default function AvailabilityPage() {
  const [days, setDays] = useState<Day[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/studio/availability")
      .then((r) => r.json())
      .then((res) => {
        // fill any weekday the database has never seen
        const byDay: Record<number, Day> = {};
        for (const d of res.days ?? []) byDay[d.dayOfWeek] = d;
        setDays(
          Array.from({ length: 7 }, (_, i) =>
            byDay[i] ?? { dayOfWeek: i, startMinutes: 540, endMinutes: 1080, active: false },
          ),
        );
        setBlocked(res.blocked ?? []);
      })
      .catch(console.error);
  }, [reloadKey]);

  const patchDay = (dayOfWeek: number, patch: Partial<Day>) =>
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/studio/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const block = async () => {
    if (!newDate) return;
    await fetch("/api/studio/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, reason: newReason || undefined }),
    });
    setNewDate("");
    setNewReason("");
    setReloadKey((k) => k + 1);
  };

  const unblock = async (date: string) => {
    await fetch("/api/studio/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    setReloadKey((k) => k + 1);
  };

  const openDays = days.filter((d) => d.active).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <CalendarClock className="h-6 w-6" />
            Disponibilidad
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
            {openDays === 0
              ? "Ningún día abierto — nadie puede reservar en línea."
              : `Abres ${openDays} ${openDays === 1 ? "día" : "días"} a la semana. Las clientas solo ven horarios donde cabe su servicio.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" /> Guardado
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Weekly hours */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--admin-text)" }}>
            Horario semanal
          </h2>

          {/* A phone cannot fit "Wednesday" plus two time fields on one line —
              the second one used to run off the screen. Below sm the times drop
              to their own row and share the full width. */}
          <div className="space-y-2">
            {days.map((day) => (
              <div
                key={day.dayOfWeek}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2"
                style={{ opacity: day.active ? 1 : 0.5 }}
              >
                <label className="flex items-center gap-2 sm:w-32 sm:shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.active}
                    onChange={(e) => patchDay(day.dayOfWeek, { active: e.target.checked })}
                    className="h-4 w-4 cursor-pointer accent-[#6B4E3D] shrink-0"
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                    {DAY_NAMES[day.dayOfWeek]}
                  </span>
                  {!day.active && (
                    <span className="text-sm sm:hidden ml-auto" style={{ color: "var(--admin-muted)" }}>
                      Cerrado
                    </span>
                  )}
                </label>

                {day.active ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0 pl-6 sm:pl-0">
                    <input
                      type="time"
                      value={toHHMM(day.startMinutes)}
                      onChange={(e) =>
                        patchDay(day.dayOfWeek, { startMinutes: toMinutes(e.target.value) })
                      }
                      // min-w-0 lets the field shrink instead of pushing its
                      // neighbour off the edge
                      className="flex-1 min-w-0"
                      style={inputStyle}
                    />
                    <span className="text-sm shrink-0" style={{ color: "var(--admin-muted)" }}>
                      a
                    </span>
                    <input
                      type="time"
                      value={toHHMM(day.endMinutes)}
                      onChange={(e) =>
                        patchDay(day.dayOfWeek, { endMinutes: toMinutes(e.target.value) })
                      }
                      className="flex-1 min-w-0"
                      style={inputStyle}
                    />
                  </div>
                ) : (
                  <span className="text-sm hidden sm:inline" style={{ color: "var(--admin-muted)" }}>
                    Cerrado
                  </span>
                )}
              </div>
            ))}
          </div>

          {days.some((d) => d.active && d.endMinutes <= d.startMinutes) && (
            <p className="text-xs mt-3" style={{ color: "#f05252" }}>
              La hora de cierre debe ser posterior a la de apertura, o ese día se omite.
            </p>
          )}
        </div>

        {/* Days off */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
        >
          <h2 className="text-base font-semibold mb-1 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <CalendarOff className="h-5 w-5" />
            Días libres
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--admin-muted)" }}>
            Feriados o cierres puntuales. Estos mandan sobre el horario semanal.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 min-w-0"
              style={inputStyle}
            />
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Motivo (opcional)"
              autoComplete="off"
              className="flex-1 min-w-0"
              style={inputStyle}
            />
            <button
              onClick={block}
              disabled={!newDate}
              className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-40 transition-colors"
              style={{ border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            >
              <Plus className="h-4 w-4" />
              Bloquear
            </button>
          </div>

          {blocked.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
              Ningún día bloqueado.
            </p>
          ) : (
            <div className="space-y-2">
              {blocked.map((b) => (
                <div
                  key={b.date}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: "1px solid var(--admin-border)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                    {b.date}
                  </span>
                  {b.reason && (
                    <span className="text-sm truncate" style={{ color: "var(--admin-muted)" }}>
                      {b.reason}
                    </span>
                  )}
                  <button
                    onClick={() => unblock(b.date)}
                    aria-label={`Desbloquear ${b.date}`}
                    className="ml-auto shrink-0 p-1.5 rounded-lg cursor-pointer transition-colors"
                    style={{ color: "var(--admin-muted)" }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs mt-5 max-w-2xl" style={{ color: "var(--admin-muted)" }}>
        Un horario se ofrece solo cuando el servicio completo cabe antes de cerrar y
        no se cruza con nada ya reservado. Define cuánto dura cada servicio en
        Contenido → Servicios. Ejemplo: un servicio de dos horas en un día que
        cierra a las 6:00 PM se ofrece por última vez a las 4:00 PM.
      </p>
    </div>
  );
}
