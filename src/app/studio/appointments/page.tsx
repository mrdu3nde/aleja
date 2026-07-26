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

type Appointment = Record<string, unknown>;

/** Filters named after the owner's daily tasks, not after internal status values. */
const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "deposit", label: "Needs deposit" },
  { key: "all", label: "All" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
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
            Appointments
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
            {loading && !total ? (
              "Loading..."
            ) : (
              <>
                {total} {total === 1 ? "appointment" : "appointments"}
                {pendingDeposits > 0 && (
                  <>
                    {" · "}
                    <button
                      onClick={() => changeFilter("deposit")}
                      className="underline cursor-pointer font-medium"
                      style={{ color: "#B45309" }}
                    >
                      {pendingDeposits} awaiting deposit
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
              { key: "list", label: "List", icon: List },
              { key: "week", label: "Week", icon: CalendarRange },
              { key: "month", label: "Month", icon: CalendarDays },
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
            <span className="hidden sm:inline">New appointment</span>
          </button>
        </div>
      </div>

      {newConfirmations > 0 && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{ backgroundColor: "#dcfce7", color: "#166534" }}
        >
          <BellRing className="h-4 w-4 shrink-0" />
          {newConfirmations} {newConfirmations === 1 ? "client" : "clients"} confirmed since
          you last looked — open the appointment to see the details.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search client..." />
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
        />
      ) : view === "month" ? (
        <AppointmentCalendar
          month={month}
          appointments={appointments}
          onMonthChange={setMonth}
          onSelect={(id) => router.push(`/studio/appointments/${id}`)}
          loading={loading}
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
                ? "No results"
                : filter === "deposit"
                  ? "No appointment is awaiting deposit"
                  : filter === "past"
                    ? "No past appointments"
                    : filter === "cancelled"
                      ? "Nothing cancelled"
                      : "No upcoming appointments"
            }
            emptyDescription={
              search
                ? `No client matches "${search}".`
                : filter === "deposit"
                  ? "All deposits are up to date."
                  : filter === "cancelled"
                    ? "No appointment has been cancelled."
                    : "Bookings from your website will show up here automatically."
            }
            emptyAction={
              !search &&
                filter !== "deposit" &&
                filter !== "past" &&
                filter !== "cancelled"
                ? {
                    label: "+ Create one manually",
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
        title="Confirm deposit received"
        message={
          depositTarget
            ? `Confirm that ${depositTarget.clientName} sent the $${String(
                depositTarget.depositAmount ?? 20,
              )} USD deposit. This will set the appointment to CONFIRMED and immediately email the client. Check your Zelle before continuing.`
            : ""
        }
        confirmLabel={markingId ? "Saving..." : "Yes, deposit received"}
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
