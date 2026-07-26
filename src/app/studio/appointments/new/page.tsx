"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, type AppointmentData } from "@/lib/admin-validators";
import { FormField, inputClass, inputStyle } from "@/components/admin/FormField";
import { ClientPicker } from "@/components/admin/ClientPicker";
import { DEPOSIT_PRESETS, depositConfig } from "@/lib/deposit";

import { ArrowLeft } from "lucide-react";

type Client = Record<string, unknown>;

export default function NewAppointmentPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  // "none" | "custom" | a preset amount as string
  const [depositChoice, setDepositChoice] = useState<string>(String(depositConfig.amount));
  const [customDeposit, setCustomDeposit] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [priceEdited, setPriceEdited] = useState(false);
  const [services, setServices] = useState<
    Array<{ id: string; name: string; price: string | number | null }>
  >([]);

  // Services and their fixed prices are managed in Content, so adding one there
  // makes it bookable here without touching code.
  useEffect(() => {
    fetch("/api/studio/services")
      .then((r) => r.json())
      .then((res) =>
        setServices((res.data ?? []).filter((s: { active: boolean }) => s.active)),
      )
      .catch(() => {});
  }, []);

  const pickService = (label: string) => {
    setValue("service", label);
    // Don't clobber a price she typed herself.
    if (priceEdited) return;
    const fixed = Number(services.find((s) => s.name === label)?.price ?? 0);
    setServicePrice(fixed > 0 ? String(fixed) : "");
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentData>({
    resolver: zodResolver(appointmentSchema),
    // Status is never chosen by hand: a new booking is always pending, and it
    // becomes confirmed either when the client confirms a deposit-free booking
    // or when the deposit is marked as received.
    defaultValues: { status: "pending", clientEmail: "" },
  });

  const pickClient = (c: Client) => {
    setClient(c);
    setValue("clientId", c.id as string);
    setValue("clientName", (c.name as string) ?? "");
    setValue("clientEmail", (c.email as string) ?? "");
    setValue("clientPhone", (c.phone as string) ?? "");
  };

  const clearClient = () => {
    setClient(null);
    setValue("clientId", undefined);
  };

  const onSubmit = async (data: AppointmentData) => {
    const amount =
      depositChoice === "custom" ? Number(customDeposit) : Number(depositChoice);

    const payload = {
      ...data,
      ...(Number(servicePrice) > 0 ? { servicePrice: Number(servicePrice) } : {}),
      depositRequired: depositChoice !== "none",
      ...(depositChoice !== "none" && Number.isFinite(amount) && amount >= 0
        ? { depositAmount: amount }
        : {}),
    };

    const res = await fetch("/api/studio/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const apt = await res.json();
      // land on the detail with the share sheet already open — creating a
      // booking by hand almost always means sending it to the client next
      router.push(`/studio/appointments/${apt.id}?share=1`);
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
          <FormField label="Existing client">
            <ClientPicker selected={client} onSelect={pickClient} onClear={clearClient} />
          </FormField>

          <div style={{ borderTop: "1px solid var(--admin-border)" }} className="pt-4">
            <FormField label="Client Name" error={errors.clientName?.message}>
              <input {...register("clientName")} autoComplete="off" data-lpignore="true" data-1p-ignore="" className={inputClass} style={inputStyle} placeholder="Full name" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Client Phone">
              <input {...register("clientPhone")} type="tel" autoComplete="off" data-lpignore="true" data-1p-ignore="" className={inputClass} style={inputStyle} placeholder="(555) 000-0000" />
            </FormField>

            <FormField label="Client Email" error={errors.clientEmail?.message}>
              <input {...register("clientEmail")} type="email" autoComplete="off" data-lpignore="true" data-1p-ignore="" className={inputClass} style={inputStyle} placeholder="Optional" />
            </FormField>
          </div>

          <FormField label="Service" error={errors.service?.message}>
            <select
              {...register("service")}
              onChange={(e) => pickService(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Select service...</option>
              {services.map((s) => {
                const fixed = Number(s.price ?? 0);
                return (
                  <option key={s.id} value={s.name}>
                    {s.name}
                    {fixed > 0 ? ` — $${fixed}` : ""}
                  </option>
                );
              })}
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date">
              <input {...register("preferredDate")} type="date" className={inputClass} style={inputStyle} />
            </FormField>

            <FormField label="Time">
              <input {...register("preferredTime")} type="time" className={inputClass} style={inputStyle} />
            </FormField>
          </div>

          <FormField label="Service price">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--admin-muted)" }}>
                $
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={servicePrice}
                onChange={(e) => {
                  setServicePrice(e.target.value);
                  setPriceEdited(true);
                }}
                placeholder="Set a fixed price in Content"
                className={inputClass}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--admin-muted)" }}>
              {priceEdited
                ? "Custom price for this booking only."
                : "Filled from the fixed price in Content. Change it here for a one-off."}
            </p>
          </FormField>

          <FormField label="Deposit">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={depositChoice}
                onChange={(e) => setDepositChoice(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                {DEPOSIT_PRESETS.map((amount) => (
                  <option key={amount} value={String(amount)}>
                    ${amount} USD
                  </option>
                ))}
                <option value="custom">Other amount...</option>
                <option value="none">No deposit</option>
              </select>

              {depositChoice === "custom" && (
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={customDeposit}
                  onChange={(e) => setCustomDeposit(e.target.value)}
                  placeholder="Amount in USD"
                  className={inputClass}
                  style={inputStyle}
                />
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--admin-muted)" }}>
              {depositChoice === "none" ||
              (depositChoice === "custom" && Number(customDeposit) === 0)
                ? "No deposit — she confirms and that's it, no payment step."
                : "Shown to her when she confirms, and on the Zelle instructions."}
            </p>
          </FormField>

          <FormField label="Message">
            <textarea {...register("message")} rows={3} className={inputClass} style={inputStyle} placeholder="Notes..." />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#6B4E3D] text-white py-3 font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creating..." : "Create and share"}
          </button>
          <p className="text-xs text-center" style={{ color: "var(--admin-muted)" }}>
            Starts as pending. It becomes confirmed when she confirms — or, if
            there is a deposit, once you mark the payment as received.
          </p>
        </form>
      </div>
    </div>
  );
}
