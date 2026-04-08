"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormField } from "@/components/admin/FormField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ArrowLeft, UserPlus } from "lucide-react";

type Lead = Record<string, string | null>;

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/leads/${id}`)
      .then((r) => r.json())
      .then(setLead)
      .catch(console.error);
  }, [id]);

  const updateStatus = async (status: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLead(updated);
    }
    setSaving(false);
  };

  const handleConvert = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/leads/${id}/convert`, {
      method: "POST",
    });
    if (res.ok) {
      const { clientId } = await res.json();
      router.push(`/admin/clients/${clientId}`);
    }
    setSaving(false);
    setShowConvert(false);
  };

  if (!lead) return <p style={{ color: "var(--admin-muted)" }}>Loading...</p>;

  const isConverted = lead.status === "converted";

  return (
    <div>
      <button
        onClick={() => router.push("/admin/leads")}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>{lead.name}</h1>
          <StatusBadge status={lead.status ?? "new"} />
        </div>
        {!isConverted && (
          <button
            onClick={() => setShowConvert(true)}
            className="flex items-center gap-2 rounded-xl bg-green-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Convert to Client
          </button>
        )}
      </div>

      <div className="max-w-xl rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <div className="space-y-4">
          <FormField label="Email">
            <p style={{ color: "var(--admin-text)" }}>{lead.email}</p>
          </FormField>
          <FormField label="Phone">
            <p style={{ color: "var(--admin-text)" }}>{lead.phone ?? "—"}</p>
          </FormField>
          <FormField label="Message">
            <p className="whitespace-pre-wrap" style={{ color: "var(--admin-muted)" }}>{lead.message}</p>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Source">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>{lead.source ?? "—"}</p>
            </FormField>
            <FormField label="Received">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>
                {lead.createdAt
                  ? new Date(lead.createdAt).toLocaleString()
                  : "—"}
              </p>
            </FormField>
          </div>
        </div>
      </div>

      {/* Status actions */}
      {!isConverted && (
        <>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
            Update Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {["new", "contacted", "archived"].map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={saving || lead.status === s}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors cursor-pointer disabled:opacity-40 ${
                  lead.status === s ? "bg-[#6B4E3D] text-white" : ""
                }`}
                style={
                  lead.status === s
                    ? undefined
                    : { backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }
                }
                onMouseEnter={(e) => {
                  if (lead.status !== s) e.currentTarget.style.backgroundColor = "var(--admin-filter-hover)";
                }}
                onMouseLeave={(e) => {
                  if (lead.status !== s) e.currentTarget.style.backgroundColor = "var(--admin-filter-bg)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={showConvert}
        title="Convert Lead to Client"
        message={`This will create a new client from ${lead.name}'s information and link any existing appointments.`}
        confirmLabel="Convert"
        onConfirm={handleConvert}
        onCancel={() => setShowConvert(false)}
      />
    </div>
  );
}
