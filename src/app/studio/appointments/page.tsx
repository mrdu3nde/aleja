"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, CalendarDays, List, BellRing, CalendarRange } from "lucide-react";
import { PushToggle } from "@/components/admin/PushToggle";
import { AppointmentCalendar } from "@/components/admin/AppointmentCalendar";
import { AppointmentWeek, startOfWeek } from "@/components/admin/AppointmentWeek";
import { AppointmentList } from "@/components/admin/AppointmentList";
import { Pagination } from "@/components/admin/Pagination";
import { SearchInput } from "@/components/admin/SearchInput";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { isoDay } from "@/lib/dates";
import type { OpeningHours } from "@/lib/time";

type Appointment = Record<string, unknown>;

/** Filters named after the owner's daily tasks, not after internal status values. */
const FILTERS = [
  { key: "upcoming", label: "Próximas" },
  { key: "deposit", label: "Falta depósito" },
  { key: "all", label: "Todas" },
  { key: "past", label: "Pasadas" },
  { key: "cancelled", label: "Canceladas" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function AppointmentsPageInner() {
  const searchParams = useSearchParams();
  const initialFilter = FILTERS.some((f) => f.key === searchParams.get("filter"))
    ? (searchParams.get("filter") as FilterKey)
    : "upcoming";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [newConfirmations, setNewConfirmations] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [view, setView] = useState<"list" | "week" | "month">("list");
  const [month, setMonth] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [depositTarget, setDepositTarget] = useState<Appointment | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const router = useRouter();

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    if (view === "month" || view === "week") {
      let first: Date;
      let last: Date;
      if (view === "week") {
        first = new Date(weekStart);
        last = new Date(weekStart);
        last.setDate(last.getDate() + 6);
      } else {
        // pad the range so appointments in the leading/trailing week are included
        first = new Date(month.getFullYear(), month.getMonth(), 1);
        last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        first.setDate(first.getDate() - 7);
        last.setDate(last.getDate() + 7);
      }
      params.set("from", isoDay(first));
      params.set("to", isoDay(last));
      if (filter === "deposit") params.set("deposit", "pending");
      if (filter === "cancelled") params.set("status", "cancelled");
      return params;
    }

    if (filter === "deposit") {
      params.set("deposit", "pending");
      params.set("scope", "all");
    } else if (filter === "cancelled") {
      // cancelled bookings sit outside the date scopes: she wants to find one,
      // not to know whether it was going to be this week
      params.set("status", "cancelled");
      params.set("scope", "all");
    } else {
      params.set("scope", filter);
    }
    params.set("page", String(page));
    params.set("limit", "20");
    return params;
  }, [filter, search, page, view, month, weekStart]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/studio/appointments?${buildParams()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        setAppointments(json.data ?? []);
        setTotalPages(json.totalPages ?? 1);
        setTotal(json.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(true);
          setAppointments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [buildParams, reloadKey]);

  // Summary counter, independent of the current filter so it always tells the truth.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/studio/appointments?deposit=pending&scope=all&limit=1")
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) setPendingDeposits(res.total ?? 0);
      })
      .catch(() => {});
    // Opening hours are stable, so one fetch feeds both calendar views.
    fetch("/api/studio/availability")
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        const days: OpeningHours["days"] = {};
        for (let i = 0; i < 7; i++) days[i] = null;
        for (const d of res.days ?? []) {
          days[d.dayOfWeek] = d.active
            ? { startMinutes: d.startMinutes, endMinutes: d.endMinutes }
            : null;
        }
        const blocked: OpeningHours["blocked"] = {};
        for (const b of res.blocked ?? []) blocked[b.date] = b.reason ?? "";
        setHours({ days, blocked });
      })
      .catch(() => {});
    fetch("/api/studio/confirmations")
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) setNewConfirmations(res.count ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const confirmDeposit = async () => {
    if (!depositTarget) return;
    const id = depositTarget.id as string;
    setMarkingId(id);
    try {
      await fetch(`/api/studio/appointments/${id}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "received" }),
      });
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingId(null);
      setDepositTarget(null);
    }
  };

  const changeFilter = (key: FilterKey) => {
    setFilter(key);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
            Citas
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
            {loading && !total ? (
              "Cargando..."
            ) : (
              <>
                {total} {total === 1 ? "cita" : "citas"}
                {pendingDeposits > 0 && (
                  <>
                    {" · "}
                    <button
                      onClick={() => changeFilter("deposit")}
                      className="underline cursor-pointer font-medium"
                      style={{ color: "#B45309" }}
                    >
                      {pendingDeposits} esperan depósito
                    </button>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ backgroundColor: "var(--admin-filter-bg)" }}
          >
            {([
              { key: "list", label: "Lista", icon: List },
              { key: "week", label: "Semana", icon: CalendarRange },
              { key: "month", label: "Mes", icon: CalendarDays },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                aria-pressed={view === key}
                aria-label={label}
                title={label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  view === key ? "bg-[#6B4E3D] text-white" : ""
                }`}
                style={view === key ? undefined : { color: "var(--admin-text)" }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Bookings arrive from the website on their own — creating one by hand is the
              exception, so this stays secondary. */}
          <button
            onClick={() => router.push("/studio/appointments/new")}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
            style={{ border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva cita</span>
          </button>
        </div>
      </div>

      {newConfirmations > 0 && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ backgroundColor: "#dcfce7", color: "#166534" }}
        >
          <BellRing className="h-4 w-4 shrink-0" />
          {newConfirmations} {newConfirmations === 1 ? "clienta confirmó" : "clientas confirmaron"} desde
          la última vez — abre la cita para ver los detalles.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar clienta..." />
        </div>
        <PushToggle />
      </div>

      {/* Task filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => changeFilter(f.key)}
              aria-pressed={active}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                active ? "bg-[#6B4E3D] text-white" : ""
              }`}
              style={
                active
                  ? undefined
                  : { backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }
              }
            >
              {f.label}
              {f.key === "deposit" && pendingDeposits > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                  style={
                    active
                      ? { backgroundColor: "rgba(255,255,255,0.25)" }
                      : { backgroundColor: "#fef3c7", color: "#92400e" }
                  }
                >
                  {pendingDeposits}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {view === "week" ? (
        <AppointmentWeek
          weekStart={weekStart}
          appointments={appointments}
          onWeekChange={setWeekStart}
          onSelect={(id) => router.push(`/studio/appointments/${id}`)}
          loading={loading}
          hours={hours}
        />
      ) : view === "month" ? (
        <AppointmentCalendar
          month={month}
          appointments={appointments}
          onMonthChange={setMonth}
          onSelect={(id) => router.push(`/studio/appointments/${id}`)}
          loading={loading}
          hours={hours}
        />
      ) : (
        <>
          <AppointmentList
            appointments={appointments}
            loading={loading}
            error={error}
            onRetry={() => setReloadKey((k) => k + 1)}
            onSelect={(id) => router.push(`/studio/appointments/${id}`)}
            onMarkDeposit={setDepositTarget}
            markingId={markingId}
            emptyTitle={
              search
                ? "Sin resultados"
                : filter === "deposit"
                  ? "Ninguna cita espera depósito"
                  : filter === "past"
                    ? "No hay citas pasadas"
                    : filter === "cancelled"
                      ? "Nada cancelado"
                      : "No tienes citas próximas"
            }
            emptyDescription={
              search
                ? `Ninguna clienta coincide con "${search}".`
                : filter === "deposit"
                  ? "Todos los depósitos están al día."
                  : filter === "cancelled"
                    ? "Ninguna cita ha sido cancelada."
                    : "Las reservas de tu web aparecerán aquí automáticamente."
            }
            emptyAction={
              !search &&
                filter !== "deposit" &&
                filter !== "past" &&
                filter !== "cancelled"
                ? {
                    label: "+ Crear una a mano",
                    onClick: () => router.push("/studio/appointments/new"),
                  }
                : undefined
            }
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={depositTarget !== null}
        title="Confirmar depósito recibido"
        message={
          depositTarget
            ? `Confirma que ${depositTarget.clientName} envió el depósito de $${String(
                depositTarget.depositAmount ?? 20,
              )} USD. La cita pasará a CONFIRMADA y se le enviará un correo de inmediato. Revisa tu Zelle antes de continuar.`
            : ""
        }
        confirmLabel={markingId ? "Guardando..." : "Sí, recibí el depósito"}
        variant="success"
        busy={markingId !== null}
        onConfirm={confirmDeposit}
        onCancel={() => setDepositTarget(null)}
      />
    </div>
  );
}

/**
 * useSearchParams() opts a page out of static prerendering unless it sits under
 * a Suspense boundary — without this the production build fails outright.
 */
export default function AppointmentsPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--admin-muted)" }}>Loading...</p>}>
      <AppointmentsPageInner />
    </Suspense>
  );
}
