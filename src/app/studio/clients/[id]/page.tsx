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
import { computeBalance } from "@/lib/balance";

type ClientWithAppointments = ClientData & {
  id: string;
  created_at: string;
  appointments: Array<Record<string, unknown>>;
};

const money = (n: number) => `$${n.toFixed(2)}`;

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
    fetch(`/api/studio/clients/${id}`)
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
    const res = await fetch(`/api/studio/clients/${id}`, {
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
    await fetch(`/api/studio/clients/${id}`, { method: "DELETE" });
    router.push("/studio/clients");
  };

  if (!client) {
    return <p style={{ color: "var(--admin-muted)" }}>Cargando...</p>;
  }

  // What this client has actually left in the studio, across every visit.
  const lifetime = (client.appointments ?? []).reduce<{
    collected: number;
    remaining: number;
  }>((total, apt) => {
      const b = computeBalance(apt as Parameters<typeof computeBalance>[0]);
    return {
      collected: total.collected + b.collected,
      remaining: total.remaining + b.remaining,
    };
  }, { collected: 0, remaining: 0 });

  return (
    <div>
      <button
        onClick={() => router.push("/studio/clients")}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Volver a Clientas
      </button>

      <div className="flex items-center gap-3 mb-6">
        {/* Destructive and rare: quiet by default, red only on intent. Leads the
            header because it acts on the whole record, not on one card. */}
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          aria-label="Eliminar clienta"
          title="Eliminar clienta"
          className="shrink-0 flex items-center justify-center h-9 w-9 rounded-lg cursor-pointer transition-colors"
          style={{ color: "var(--admin-muted)", backgroundColor: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f05252";
            e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--admin-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-bold min-w-0 truncate" style={{ color: "var(--admin-text)" }}>{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* Edit form */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Nombre" error={errors.name?.message}>
            <input {...register("name")} className={inputClass} style={inputStyle} />
          </FormField>
          <FormField label="Correo" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputClass} style={inputStyle} />
          </FormField>
          <FormField label="Teléfono">
            <input {...register("phone")} type="tel" className={inputClass} style={inputStyle} />
          </FormField>
          <FormField label="Prefiere contacto por" error={errors.contactPreference?.message}>
            <select {...register("contactPreference")} className={inputClass} style={inputStyle}>
              <option value="">Elige...</option>
              <option value="email">Correo</option>
              <option value="phone">Teléfono</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </FormField>
          <FormField label="Notas">
            <textarea {...register("notes")} rows={3} className={inputClass} style={inputStyle} />
          </FormField>
          {isDirty && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#6B4E3D] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          )}
        </form>
      </div>

      {/* Appointment history */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
            Historial de citas
            {client.appointments?.length ? (
              <span className="ml-2 text-sm font-normal" style={{ color: "var(--admin-muted)" }}>
                {client.appointments.length}
              </span>
            ) : null}
          </h2>
          {lifetime.collected > 0 && (
            <span className="text-sm shrink-0" style={{ color: "var(--admin-muted)" }}>
              pagó{" "}
              <strong style={{ color: "var(--admin-text)" }}>{money(lifetime.collected)}</strong>
              {lifetime.remaining > 0 && (
                <>
                  {" · debe "}
                  <strong style={{ color: "#B45309" }}>{money(lifetime.remaining)}</strong>
                </>
              )}
            </span>
          )}
        </div>
      {!client.appointments?.length ? (
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>Aún no tiene citas</p>
      ) : (
        <div className="rounded-2xl" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
          {/* Scrolls inside itself past a handful of visits, and sideways on a
              phone where three columns do not fit. */}
          <div className="overflow-auto rounded-2xl" style={{ maxHeight: 380 }}>
          <table className="w-full" style={{ minWidth: 420 }}>
            <thead>
              <tr
                className="sticky top-0 z-10"
                style={{ borderBottom: "1px solid var(--admin-border)", backgroundColor: "var(--admin-card)" }}
              >
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                  Servicio
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                  Fecha
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                  Estado
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--admin-muted)" }}>
                  Pagado
                </th>
              </tr>
            </thead>
            <tbody>
              {client.appointments.map((apt, i) => (
                <tr
                  key={apt.id as string}
                  onClick={() =>
                    router.push(`/studio/appointments/${apt.id as string}`)
                  }
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: i < client.appointments.length - 1 ? "1px solid color-mix(in srgb, var(--admin-border) 50%, transparent)" : undefined }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--admin-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td className="px-5 py-4 text-sm">{apt.service as string}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: "var(--admin-muted)" }}>
                    {(apt.preferredDate as string) ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={apt.status as string} />
                  </td>
                  <td className="px-5 py-4 text-sm text-right whitespace-nowrap">
                    {(() => {
                      const b = computeBalance(apt as Parameters<typeof computeBalance>[0]);
                      if (!b.hasPrice && b.collected === 0) {
                        return <span style={{ color: "var(--admin-muted)" }}>—</span>;
                      }
                      return (
                        <>
                          <span style={{ color: "var(--admin-text)" }}>{money(b.collected)}</span>
                          {b.remaining > 0 && (
                            <span style={{ color: "#B45309" }}> / {money(b.total)}</span>
                          )}
                        </>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Eliminar clienta"
        message="¿Segura? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
