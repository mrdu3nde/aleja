"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField } from "@/components/admin/FormField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ArrowLeft, DollarSign, Check, X } from "lucide-react";
import { buildReferenceCode } from "@/lib/deposit";

type Appointment = {
  id?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string | null;
  service?: string;
  preferredDate?: string | null;
  status?: string;
  message?: string | null;
  source?: string | null;
  depositRequired?: boolean;
  depositAmount?: string | number | null;
  depositStatus?: string;
  depositReceivedAt?: string | null;
};

const statuses = ["pending", "confirmed", "cancelled", "completed"] as const;

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [apt, setApt] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [depositSaving, setDepositSaving] = useState(false);

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

  const updateDeposit = async (action: "received" | "unmark") => {
    setDepositSaving(true);
    const res = await fetch(`/api/admin/appointments/${id}/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApt(updated);
    }
    setDepositSaving(false);
  };

  if (!apt) return <p style={{ color: "var(--admin-muted)" }}>Loading...</p>;

  const depositReceived = apt.depositStatus === "received";
  const depositRequired = apt.depositRequired !== false;
  const referenceCode = apt.id ? buildReferenceCode(apt.id) : "";
  const depositAmount = apt.depositAmount ?? "20.00";

  return (
    <div>
      <button
        onClick={() => router.push("/admin/appointments")}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Appointments
      </button>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          {apt.clientName}
        </h1>
        <StatusBadge status={apt.status ?? "pending"} />
        {depositRequired && (
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: depositReceived ? "#dcfce7" : "#fef3c7",
              color: depositReceived ? "#166534" : "#92400e",
            }}
          >
            <DollarSign className="h-3 w-3" />
            {depositReceived ? "Deposit received" : "Awaiting deposit"}
          </span>
        )}
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

      {/* Deposit section */}
      {depositRequired && (
        <div className="max-w-xl rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <DollarSign className="h-5 w-5" />
            Deposit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <FormField label="Amount">
              <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>${String(depositAmount)} USD</p>
            </FormField>
            <FormField label="Reference">
              <p className="text-sm font-mono font-semibold" style={{ color: "var(--admin-text)" }}>{referenceCode}</p>
            </FormField>
            <FormField label="Received at">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>
                {apt.depositReceivedAt
                  ? new Date(apt.depositReceivedAt).toLocaleString()
                  : "—"}
              </p>
            </FormField>
          </div>

          {depositReceived ? (
            <button
              onClick={() => updateDeposit("unmark")}
              disabled={depositSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-40 transition-colors"
              style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
            >
              <X className="h-4 w-4" />
              Unmark deposit
            </button>
          ) : (
            <button
              onClick={() => updateDeposit("received")}
              disabled={depositSaving}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              {depositSaving ? "Saving..." : "Mark deposit as received"}
            </button>
          )}
          {!depositReceived && (
            <p className="text-xs mt-3" style={{ color: "var(--admin-muted)" }}>
              Marking this will set the appointment to <strong>confirmed</strong> and email the client.
            </p>
          )}
        </div>
      )}

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
