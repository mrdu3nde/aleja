"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Inbox } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Stats = {
  totalClients: number;
  activeAppointments: number;
  newLeads: number;
  recentAppointments: Array<Record<string, string>>;
  recentLeads: Array<Record<string, string>>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--admin-text)" }}>Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard
          label="Total Clients"
          value={stats?.totalClients ?? "—"}
          icon={Users}
        />
        <StatsCard
          label="Active Appointments"
          value={stats?.activeAppointments ?? "—"}
          icon={Calendar}
        />
        <StatsCard
          label="New Leads"
          value={stats?.newLeads ?? "—"}
          icon={Inbox}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-text)" }}>
            Recent Appointments
          </h2>
          {!stats?.recentAppointments?.length ? (
            <p className="text-sm" style={{ color: "var(--admin-muted)" }}>No appointments yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => router.push(`/admin/appointments/${apt.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--admin-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                      {apt.clientName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-muted)" }}>{apt.service}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-text)" }}>
            Recent Leads
          </h2>
          {!stats?.recentLeads?.length ? (
            <p className="text-sm" style={{ color: "var(--admin-muted)" }}>No leads yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => router.push(`/admin/leads/${lead.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--admin-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>
                      {lead.name}
                    </p>
                    <p className="text-xs truncate max-w-[120px] sm:max-w-[200px]" style={{ color: "var(--admin-muted)" }}>
                      {lead.message}
                    </p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
