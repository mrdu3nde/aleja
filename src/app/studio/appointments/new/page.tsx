"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, type AppointmentData } from "@/lib/admin-validators";
import { FormField, inputClass, inputStyle } from "@/components/admin/FormField";
import { ClientPicker } from "@/components/admin/ClientPicker";
import { TimeSlotPicker } from "@/components/booking/TimeSlotPicker";
import { AvailableDatePicker } from "@/components/booking/AvailableDatePicker";
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
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
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
    setService(label);
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
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--admin-text)" }}>
        Nueva cita
      </h1>

      <div className="max-w-xl rounded-2xl p-6" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Clienta existente">
            <ClientPicker selected={client} onSelect={pickClient} onClear={clearClient} />
          </FormField>

          <div style={{ borderTop: "1px solid var(--admin-border)" }} className="pt-4">
            <FormField label="Nombre" error={errors.clientName?.message}>
              <input {...register("clientName")} autoComplete="off" data-lpignore="true" data-1p-ignore="" className={inputClass} style={inputStyle} placeholder="Nombre completo" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Teléfono">
              <input {...register("clientPhone")} type="tel" autoComplete="off" data-lpignore="true" data-1p-ignore="" className={inputClass} style={inputStyle} placeholder="(555) 000-0000" />
            </FormField>

            <FormField label="Correo" error={errors.clientEmail?.message}>
              <input {...register("clientEmail")} type="email" autoComplete="off" data-lpignore="true" data-1p-ignore="" className={inputClass} style={inputStyle} placeholder="Opcional" />
            </FormField>
          </div>

          <FormField label="Servicio" error={errors.service?.message}>
            <select
              {...register("service")}
              onChange={(e) => pickService(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Elige un servicio...</option>
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
            <FormField label="Fecha">
              {/* Not a native date input: it cannot grey out the days she is
                  closed, so Android offered every one of them. */}
              <AvailableDatePicker
                lang="es"
                service={service}
                value={date}
                onChange={(d) => {
                  setDate(d);
                  setValue("preferredDate", d);
                }}
              />
            </FormField>


          </div>

          <FormField label="Hora">
            {/* Only slots that fit the whole service and clash with nothing */}
            <TimeSlotPicker
              lang="es"
              service={service}
              date={date}
              value={time}
              onChange={(t) => {
                setTime(t);
                setValue("preferredTime", t);
              }}
            />
          </FormField>

          <FormField label="Precio del servicio">
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
                placeholder="Define un precio fijo en Contenido"
                className={inputClass}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--admin-muted)" }}>
              {priceEdited
                ? "Precio especial solo para esta cita."
                : "Se toma del precio fijo en Contenido. Cámbialo aquí si es un caso puntual."}
            </p>
          </FormField>

          <FormField label="Depósito">
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
                <option value="custom">Otro monto...</option>
                <option value="none">Sin depósito</option>
              </select>

              {depositChoice === "custom" && (
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={customDeposit}
                  onChange={(e) => setCustomDeposit(e.target.value)}
                  placeholder="Monto en USD"
                  className={inputClass}
                  style={inputStyle}
                />
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--admin-muted)" }}>
              {depositChoice === "none" ||
              (depositChoice === "custom" && Number(customDeposit) === 0)
                ? "Sin depósito — ella confirma y listo, sin paso de pago."
                : "Se le muestra al confirmar, junto con las instrucciones de Zelle."}
            </p>
          </FormField>

          <FormField label="Mensaje">
            <textarea {...register("message")} rows={3} className={inputClass} style={inputStyle} placeholder="Notas..." />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#6B4E3D] text-white py-3 font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creando..." : "Crear y compartir"}
          </button>
          <p className="text-xs text-center" style={{ color: "var(--admin-muted)" }}>
            Nace como pendiente. Pasa a confirmada cuando ella confirme — o, si
            lleva depósito, cuando marques el pago como recibido.
          </p>
        </form>
      </div>
    </div>
  );
}
