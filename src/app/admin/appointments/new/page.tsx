"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, type AppointmentData } from "@/lib/admin-validators";
import { FormField, inputClass, inputStyle } from "@/components/admin/FormField";
import { ArrowLeft } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { status: "pending" },
  });

  const onSubmit = async (data: AppointmentData) => {
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const apt = await res.json();
      router.push(`/admin/appointments/${apt.id}`);
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
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--admin-text)" }}>
        New Appointment
      </h1>

      <div className="max-w-xl rounded-2xl p-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Client Name" error={errors.clientName?.message}>
            <input {...register("clientName")} className={inputClass} style={inputStyle} placeholder="Full name" />
          </FormField>

          <FormField label="Client Email" error={errors.clientEmail?.message}>
            <input {...register("clientEmail")} type="email" className={inputClass} style={inputStyle} placeholder="email@example.com" />
          </FormField>

          <FormField label="Client Phone">
            <input {...register("clientPhone")} type="tel" className={inputClass} style={inputStyle} placeholder="+1 (555) 000-0000" />
          </FormField>

          <FormField label="Service" error={errors.service?.message}>
            <select {...register("service")} className={inputClass} style={inputStyle}>
              <option value="">Select service...</option>
              <option value="Hair Services">Hair Services</option>
              <option value="Nail Services">Nail Services</option>
              <option value="Brow Services">Brow Services</option>
              <option value="Lash Services">Lash Services</option>
              <option value="Facial Treatments">Facial Treatments</option>
              <option value="Special Services">Special Services</option>
            </select>
          </FormField>

          <FormField label="Preferred Date">
            <input {...register("preferredDate")} type="date" className={inputClass} style={inputStyle} />
          </FormField>

          <FormField label="Status">
            <select {...register("status")} className={inputClass} style={inputStyle}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </FormField>

          <FormField label="Message">
            <textarea {...register("message")} rows={3} className={inputClass} style={inputStyle} placeholder="Notes..." />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#6B4E3D] text-white py-3 font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creating..." : "Create Appointment"}
          </button>
        </form>
      </div>
    </div>
  );
}
