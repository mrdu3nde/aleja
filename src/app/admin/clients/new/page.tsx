"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientData } from "@/lib/admin-validators";
import { FormField, inputClass, inputStyle } from "@/components/admin/FormField";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientData>({ resolver: zodResolver(clientSchema) });

  const onSubmit = async (data: ClientData) => {
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const client = await res.json();
      router.push(`/admin/clients/${client.id}`);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--admin-text)" }}>New Client</h1>

      <div className="max-w-xl rounded-2xl p-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" error={errors.name?.message}>
            <input {...register("name")} className={inputClass} style={inputStyle} placeholder="Full name" />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputClass} style={inputStyle} placeholder="email@example.com" />
          </FormField>

          <FormField label="Phone" error={errors.phone?.message}>
            <input {...register("phone")} type="tel" className={inputClass} style={inputStyle} placeholder="+1 (555) 000-0000" />
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
            <textarea {...register("notes")} rows={3} className={inputClass} style={inputStyle} placeholder="Any notes..." />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#6B4E3D] text-white py-3 font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creating..." : "Create Client"}
          </button>
        </form>
      </div>
    </div>
  );
}
