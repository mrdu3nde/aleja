"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientData } from "@/lib/admin-validators";
import { FormField, inputClass, inputStyle } from "@/components/admin/FormField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ArrowLeft, Trash2 } from "lucide-react";

type ClientWithAppointments = ClientData & {
  id: string;
  created_at: string;
  appointments: Array<Record<string, string>>;
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientWithAppointments | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClientData>({ resolver: zodResolver(clientSchema) });

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data);
        reset({
          name: data.name,
          email: data.email,
          phone: data.phone ?? "",
          contactPreference: data.contactPreference ?? undefined,
          notes: data.notes ?? "",
        });
      })
      .catch(console.error);
  }, [id, reset]);

  const onSubmit = async (data: ClientData) => {
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setClient((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
    router.push("/admin/clients");
  };

  if (!client) {
    return <p style={{ color: "var(--admin-muted)" }}>Loading...</p>;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/clients")}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Clients
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>{client.name}</h1>
        <button
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {/* Edit form */}
      <div className="max-w-xl rounded-2xl p-6 mb-8" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" error={errors.name?.message}>
            <input {...register("name")} className={inputClass} style={inputStyle} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputClass} style={inputStyle} />
          </FormField>
          <FormField label="Phone">
            <input {...register("phone")} type="tel" className={inputClass} style={inputStyle} />
          </FormField>
          <FormField label="Contact Preference">
            <select {...register("contactPreference")} className={inputClass} style={inputStyle}>
              <option value="">Select...</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea {...register("notes")} rows={3} className={inputClass} style={inputStyle} />
          </FormField>
          {isDirty && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#6B4E3D] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>

      {/* Appointment history */}
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--admin-text)" }}>
        Appointment History
      </h2>
      {!client.appointments?.length ? (
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>No appointments yet</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                  Service
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {client.appointments.map((apt, i) => (
                <tr
                  key={apt.id}
                  onClick={() =>
                    router.push(`/admin/appointments/${apt.id}`)
                  }
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: i < client.appointments.length - 1 ? "1px solid color-mix(in srgb, var(--admin-border) 50%, transparent)" : undefined }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--admin-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td className="px-5 py-4 text-sm">{apt.service}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: "var(--admin-muted)" }}>
                    {apt.preferredDate ?? "TBD"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={apt.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete Client"
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
