"use client";

import { CalendarDays, DollarSign, Check, AlertCircle, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { dayHeading, relativeDay, STATUS_LABELS } from "@/lib/dates";

type Appointment = Record<string, unknown>;

function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: "var(--admin-border)" }}
    />
  );
}

/** Groups stay in the order the API returned them — the query already sorts by date. */
function groupByDay(appointments: Appointment[]) {
  const groups: Array<{ key: string; heading: string; items: Appointment[] }> = [];
  for (const apt of appointments) {
    const iso = (apt.preferredDate as string | null) ?? null;
    const key = iso ?? "__undated__";
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(apt);
    } else {
      groups.push({
        key,
        heading: iso ? dayHeading(iso) : "No date",
        items: [apt],
      });
    }
  }
  return groups;
}

export function AppointmentList({
  appointments,
  loading,
  error,
  onRetry,
  onSelect,
  onMarkDeposit,
  markingId,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  appointments: Appointment[];
  loading?: boolean;
  error?: boolean;
  onRetry: () => void;
  onSelect: (id: string) => void;
  onMarkDeposit: (apt: Appointment) => void;
  markingId?: string | null;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: { label: string; onClick: () => void };
}) {
  if (error) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        <AlertCircle size={40} style={{ color: "#EF4444", margin: "0 auto 12px" }} />
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
          Could not load appointments
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--admin-muted)" }}>
          Check your connection and try again. Your appointments are safe.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // Skeletons, never the empty state — an empty list while loading reads as "you have no appointments".
  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((g) => (
          <div key={g}>
            <SkeletonPulse className="h-4 w-40 mb-3" />
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--admin-border)", backgroundColor: "var(--admin-card)" }}
            >
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="p-4 flex items-center gap-3"
                  style={{ borderBottom: i === 0 ? "1px solid var(--admin-border)" : "none" }}
                >
                  <div className="flex-1">
                    <SkeletonPulse className="h-4 w-36 mb-2" />
                    <SkeletonPulse className="h-3 w-24" />
                  </div>
                  <SkeletonPulse className="h-8 w-28" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        <CalendarDays size={40} style={{ color: "var(--admin-border)", margin: "0 auto 12px" }} />
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
          {emptyTitle}
        </h3>
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
          {emptyDescription}
        </p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="mt-5 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupByDay(appointments).map((group) => (
        <section key={group.key}>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--admin-muted)" }}
          >
            {group.heading}
            <span className="ml-2 font-normal normal-case tracking-normal">
              · {group.items.length} {group.items.length === 1 ? "appointment" : "appointments"}
            </span>
          </h2>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--admin-border)", backgroundColor: "var(--admin-card)" }}
          >
            {group.items.map((apt, i) => {
              const id = apt.id as string;
              const status = (apt.status as string) ?? "pending";
              const needsDeposit =
                apt.depositRequired !== false && apt.depositStatus !== "received";
              const relative = apt.preferredDate
                ? relativeDay(apt.preferredDate as string)
                : null;
              const marking = markingId === id;

              return (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 transition-colors"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--admin-border)" }}
                >
                  {/* Client + service — the whole block navigates to the detail */}
                  <button
                    onClick={() => onSelect(id)}
                    className="flex-1 text-left cursor-pointer min-w-0 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-medium truncate"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {apt.clientName as string}
                      </span>
                      <StatusBadge status={status} />
                      {relative && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-muted)" }}
                        >
                          {relative}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5 truncate" style={{ color: "var(--admin-muted)" }}>
                      {apt.service as string}
                      {apt.clientPhone ? ` · ${apt.clientPhone}` : ""}
                    </p>
                  </button>

                  {/* Deposit — actionable right here, no navigation needed */}
                  <div className="shrink-0">
                    {apt.depositRequired === false ? (
                      <span className="text-xs" style={{ color: "var(--admin-muted)" }}>
                        No deposit
                      </span>
                    ) : needsDeposit ? (
                      <button
                        onClick={() => onMarkDeposit(apt)}
                        disabled={marking}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors disabled:opacity-40"
                        style={{ backgroundColor: "#fef3c7", color: "#92400e", minHeight: 40 }}
                      >
                        <DollarSign className="h-4 w-4" />
                        {marking ? "Saving..." : "Mark as paid"}
                      </button>
                    ) : (
                      <span
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: "#dcfce7", color: "#166534", minHeight: 40 }}
                      >
                        <Check className="h-4 w-4" />
                        Deposit paid
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* status text kept out of colour-only signalling */}
      <p className="sr-only">
        Possible statuses: {Object.values(STATUS_LABELS).join(", ")}.
      </p>
    </div>
  );
}
