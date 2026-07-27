"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientData } from "@/lib/admin-validators";
import { FormField, inputClass, inputStyle } from "@/components/admin/FormField";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientData>({ resolver: zodResolver(clientSchema) });

  const onSubmit = async (data: ClientData) => {
    setError(null);
    try {
      const res = await fetch("/api/studio/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // A failed create used to do nothing at all, which reads as a dead button.
      if (res.status === 409) {
        const { client } = await res.json();
        setError(`${client.name} ya usa ese correo.`);
        return;
      }
      if (!res.ok) {
        setError("No se pudo crear la clienta. Inténtalo de nuevo.");
        return;
      }

      const client = await res.json();
      router.push(`/studio/clients/${client.id}`);
    } catch {
      setError("No se pudo contactar el servidor. Revisa tu conexión.");
    }
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--admin-text)" }}>Nueva clienta</h1>

      <div className="max-w-xl rounded-2xl p-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Nombre" error={errors.name?.message}>
            <input {...register("name")} className={inputClass} style={inputStyle} placeholder="Nombre completo" />
          </FormField>

          <FormField label="Correo" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputClass} style={inputStyle} placeholder="email@example.com" />
          </FormField>

          <FormField label="Teléfono" error={errors.phone?.message}>
            <input {...register("phone")} type="tel" className={inputClass} style={inputStyle} placeholder="+1 (555) 000-0000" />
          </FormField>

          <FormField label="Prefiere contacto por" error={errors.contactPreference?.message}>
            <select {...register("contactPreference")} className={inputClass} style={inputStyle}>
              <option value="">Elige...</option>
              <option value="email">Correo</option>
              <option value="phone">Teléfono</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </FormField>

          <FormField label="Notas" error={errors.notes?.message}>
            <textarea {...register("notes")} rows={3} className={inputClass} style={inputStyle} placeholder="Notas..." />
          </FormField>

          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-sm"
              style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#f05252" }}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#6B4E3D] text-white py-3 font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creando..." : "Crear clienta"}
          </button>
        </form>
      </div>
    </div>
  );
}
