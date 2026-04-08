"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField } from "@/components/admin/FormField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ArrowLeft } from "lucide-react";

type Appointment = Record<string, string | null>;

const statuses = ["pending", "confirmed", "cancelled", "completed"] as const;

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [apt, setApt] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/appointments/${id}`)
      .then((r) => r.json())
      .then(setApt)
      .catch(console.error);
  }, [id]);

  const updateStatus = async (status: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApt(updated);
    }
    setSaving(false);
  };

  if (!apt) return <p style={{ color: "var(--admin-muted)" }}>Loading...</p>;

  return (
    <div>
      <button
        onClick={() => router.push("/admin/appointments")}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Appointments
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          {apt.clientName}
        </h1>
        <StatusBadge status={apt.status ?? "pending"} />
      </div>

      <div className="max-w-xl rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <div className="space-y-4">
          <FormField label="Service">
            <p style={{ color: "var(--admin-text)" }}>{apt.service}</p>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>{apt.clientEmail}</p>
            </FormField>
            <FormField label="Phone">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>{apt.clientPhone ?? "—"}</p>
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Preferred Date">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>
                {apt.preferredDate ?? "TBD"}
              </p>
            </FormField>
            <FormField label="Source">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>{apt.source ?? "—"}</p>
            </FormField>
          </div>
          {apt.message && (
            <FormField label="Message">
              <p className="text-sm" style={{ color: "var(--admin-muted)" }}>{apt.message}</p>
            </FormField>
          )}
        </div>
      </div>

      {/* Status actions */}
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
        Update Status
      </h2>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            disabled={saving || apt.status === s}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors cursor-pointer disabled:opacity-40 ${
              apt.status === s ? "bg-[#6B4E3D] text-white" : ""
            }`}
            style={
              apt.status === s
                ? undefined
                : { backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }
            }
            onMouseEnter={(e) => {
              if (apt.status !== s) e.currentTarget.style.backgroundColor = "var(--admin-filter-hover)";
            }}
            onMouseLeave={(e) => {
              if (apt.status !== s) e.currentTarget.style.backgroundColor = "var(--admin-filter-bg)";
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
