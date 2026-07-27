"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/admin/FormField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ClientLinkModal } from "@/components/admin/ClientLinkModal";
import { ShareAppointmentModal } from "@/components/admin/ShareAppointmentModal";
import { PaymentsSection } from "@/components/admin/PaymentsSection";
import { ArrowLeft, DollarSign, Check, X, Trash2, User, UserPlus, Unlink, Send } from "lucide-react";
import { buildReferenceCode, DEPOSIT_PRESETS, depositConfig } from "@/lib/deposit";
import { formatDayLong, relativeDay, STATUS_LABELS } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";

type Appointment = {
  id?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string | null;
  service?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  status?: string;
  shareToken?: string | null;
  clientConfirmedAt?: string | null;
  message?: string | null;
  source?: string | null;
  depositRequired?: boolean;
  depositAmount?: string | number | null;
  depositStatus?: string;
  depositReceivedAt?: string | null;
  servicePrice?: string | number | null;
  payments?: Array<{
    id: string;
    amount: string | number;
    method: string;
    note?: string | null;
    createdAt: string;
  }>;
  clientId?: string | null;
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    _count?: { appointments: number };
  } | null;
};

const statuses = ["pending", "confirmed", "cancelled", "completed"] as const;

function AppointmentDetailPageInner() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apt, setApt] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [depositSaving, setDepositSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [depositConfirm, setDepositConfirm] = useState<"received" | "unmark" | null>(null);
  const [showLink, setShowLink] = useState(false);
  const [showShare, setShowShare] = useState(searchParams.get("share") === "1");
  const [reloadKey, setReloadKey] = useState(0);
  const [savingAmount, setSavingAmount] = useState(false);

  useEffect(() => {
    fetch(`/api/studio/appointments/${id}`)
      .then((r) => r.json())
      .then(setApt)
      .catch(console.error);
  }, [id, reloadKey]);

  const unlinkClient = async () => {
    const res = await fetch(`/api/studio/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: null }),
    });
    if (res.ok) setApt(await res.json());
  };

  const updateStatus = async (status: string) => {
    if (status === "cancelled") setShowShare(false);
    setSaving(true);
    const res = await fetch(`/api/studio/appointments/${id}`, {
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
    const res = await fetch(`/api/studio/appointments/${id}/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApt(updated);
    }
    setDepositSaving(false);
    setDepositConfirm(null);
  };

  const updateDepositAmount = async (value: string) => {
    if (value === "custom") return; // placeholder entry, not a real choice
    setSavingAmount(true);
    const res = await fetch(`/api/studio/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositAmount: Number(value) }),
    });
    if (res.ok) setApt(await res.json());
    setSavingAmount(false);
  };

  const handleDelete = async () => {
    await fetch(`/api/studio/appointments/${id}`, { method: "DELETE" });
    router.push("/studio/appointments");
  };

  if (!apt) return <p style={{ color: "var(--admin-muted)" }}>Cargando...</p>;

  const isCancelled = apt.status === "cancelled";
  const depositReceived = apt.depositStatus === "received";
  const depositRequired = apt.depositRequired !== false;
  const referenceCode = apt.id ? buildReferenceCode(apt.id) : "";
  const depositAmount = apt.depositAmount ?? "20.00";

  return (
    <div>
      <button
        onClick={() => router.push("/studio/appointments")}
        className="flex items-center gap-1 text-sm hover:text-[#6B4E3D] mb-4 cursor-pointer"
        style={{ color: "var(--admin-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Volver a Citas
      </button>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Destructive and rare: quiet by default, red only on intent. Leads the
            header because it acts on the whole record, not on one card. */}
        <button
          onClick={() => setShowDelete(true)}
          aria-label="Eliminar cita"
          title="Eliminar cita"
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
            {depositReceived ? "Depósito recibido" : "Falta depósito"}
          </span>
        )}
      </div>

      {/* Desktop: the booking and how it is shared on the left, the money on
          the right. The client record rides with the booking because it is
          part of who the appointment is for. Phones stack it all. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <div className="space-y-4">
          <FormField label="Servicio">
            <p style={{ color: "var(--admin-text)" }}>{apt.service}</p>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Correo">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>{apt.clientEmail}</p>
            </FormField>
            <FormField label="Teléfono">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>{apt.clientPhone ?? "—"}</p>
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Fecha">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>
                {apt.preferredDate ? (
                  <>
                    <span className="capitalize">{formatDayLong(apt.preferredDate)}</span>
                    {apt.preferredTime && (
                      <span style={{ color: "var(--admin-text)" }}> · {apt.preferredTime}</span>
                    )}
                    {relativeDay(apt.preferredDate) && (
                      <span style={{ color: "var(--admin-muted)" }}>
                        {" "}· {relativeDay(apt.preferredDate)}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "var(--admin-muted)" }}>Sin fecha</span>
                )}
              </p>
            </FormField>
            <FormField label="Origen">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>{apt.source ?? "—"}</p>
            </FormField>
          </div>
          {apt.message && (
            <FormField label="Mensaje">
              <p className="text-sm" style={{ color: "var(--admin-muted)" }}>{apt.message}</p>
            </FormField>
          )}
        </div>
      </div>

      {/* Client link — bookings arrive detached from the client record; this is
          where the owner ties them together. Always optional. */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
          <User className="h-5 w-5" />
          Expediente de la clienta
        </h2>

        {apt.client ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={() => router.push(`/studio/clients/${apt.client!.id}`)}
              className="flex-1 text-left cursor-pointer min-w-0"
            >
              <p className="font-medium" style={{ color: "var(--admin-text)" }}>
                {apt.client.name}
              </p>
              <p className="text-sm truncate" style={{ color: "var(--admin-muted)" }}>
                {formatPhone(apt.client.phone)} · {apt.client.email}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--admin-muted)" }}>
                {apt.client._count?.appointments ?? 0} citas registradas
              </p>
            </button>
            <button
              onClick={unlinkClient}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors"
              style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)", minHeight: 40 }}
            >
              <Unlink className="h-4 w-4" />
              Desvincular
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: "var(--admin-muted)" }}>
              Esta cita todavía no está vinculada a un expediente. Vincularla mantiene
              su historial junto — es opcional y puedes cambiarlo cuando quieras.
            </p>
            <button
              onClick={() => setShowLink(true)}
              className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Asignar a clienta
            </button>
          </>
        )}
      </div>

      {/* Share to confirm — the owner pre-books after talking to the client,
          then sends her a link to fill in what is missing. */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
          <Send className="h-5 w-5" />
          Compartir con la clienta
        </h2>

        {isCancelled ? (
          <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
            Esta cita está cancelada, así que no hay nada que confirmar. El
            enlace que enviaste dejó de funcionar. Vuélvela a pendiente o
            confirmada para poder compartirla otra vez.
          </p>
        ) : apt.clientConfirmedAt ? (
          <div
            className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
            style={{ backgroundColor: "#dcfce7", color: "#166534" }}
          >
            <Check className="h-4 w-4 shrink-0" />
            Confirmó el {new Date(apt.clientConfirmedAt).toLocaleString("es-US")}
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: "var(--admin-muted)" }}>
            {apt.shareToken
              ? "Ya le enviaste el enlace — todavía no confirma. Puedes enviárselo de nuevo."
              : "Envíale un enlace para que complete sus datos y vea el depósito por Zelle."}
          </p>
        )}

        {!isCancelled && (
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {apt.shareToken ? "Compartir otra vez" : "Compartir cita"}
          </button>
        )}
      </div>

        </div>

        <div className="space-y-5">
      {/* What the service costs and what has actually been collected. */}
      <PaymentsSection
        appointmentId={String(id)}
        servicePrice={apt.servicePrice}
        depositRequired={apt.depositRequired}
        depositAmount={apt.depositAmount}
        depositStatus={apt.depositStatus}
        payments={apt.payments ?? []}
        cancelled={isCancelled}
        onChanged={() => setReloadKey((k) => k + 1)}
      />

      {/* No deposit on this booking — still offer a way back, otherwise a wrong
          pick at creation time could never be undone. */}
      {!depositRequired && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <DollarSign className="h-5 w-5" />
            Depósito
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--admin-muted)" }}>
            Esta cita no lleva depósito. No se le pide pagar nada para confirmar.
          </p>
          <button
            onClick={() => updateDepositAmount(String(depositConfig.amount))}
            disabled={savingAmount}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-40 transition-colors"
            style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          >
            <DollarSign className="h-4 w-4" />
            {savingAmount ? "Guardando..." : `Pedir un depósito de $${depositConfig.amount}`}
          </button>
        </div>
      )}

      {/* Deposit section */}
      {depositRequired && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <DollarSign className="h-5 w-5" />
            Depósito
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <FormField label="Monto">
              {depositReceived ? (
                <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                  ${String(depositAmount)} USD
                </p>
              ) : (
                // editable until the money is in — after that it is a record of
                // what was actually paid
                <select
                  value={
                    DEPOSIT_PRESETS.some((p) => p === Number(depositAmount))
                      ? String(Number(depositAmount))
                      : "custom"
                  }
                  onChange={(e) => updateDepositAmount(e.target.value)}
                  disabled={savingAmount}
                  className="text-sm font-semibold rounded-lg px-2 py-1 cursor-pointer disabled:opacity-40"
                  style={{
                    border: "1px solid var(--admin-input-border)",
                    backgroundColor: "var(--admin-input)",
                    color: "var(--admin-text)",
                  }}
                >
                  {DEPOSIT_PRESETS.map((a) => (
                    <option key={a} value={String(a)}>
                      ${a} USD
                    </option>
                  ))}
                  {!DEPOSIT_PRESETS.some((p) => p === Number(depositAmount)) && (
                    <option value="custom">${String(depositAmount)} USD</option>
                  )}
                  <option value="0">Sin depósito</option>
                </select>
              )}
            </FormField>
            <FormField label="Referencia">
              <p className="text-sm font-mono font-semibold" style={{ color: "var(--admin-text)" }}>{referenceCode}</p>
            </FormField>
            <FormField label="Recibido el">
              <p className="text-sm" style={{ color: "var(--admin-text)" }}>
                {apt.depositReceivedAt
                  ? new Date(apt.depositReceivedAt).toLocaleString()
                  : "—"}
              </p>
            </FormField>
          </div>

          {depositReceived ? (
            <button
              onClick={() => setDepositConfirm("unmark")}
              disabled={depositSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-40 transition-colors"
              style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
            >
              <X className="h-4 w-4" />
              Quitar depósito
            </button>
          ) : (
            <button
              onClick={() => setDepositConfirm("received")}
              disabled={depositSaving || isCancelled}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              {depositSaving ? "Guardando..." : "Marcar depósito como recibido"}
            </button>
          )}
          {!depositReceived && (
            <p className="text-xs mt-3" style={{ color: "var(--admin-muted)" }}>
              {isCancelled
                ? "Cancelada — no se puede cobrar depósito para esta cita."
                : "Al marcarlo, la cita pasa a confirmada y se le envía un correo a la clienta."}
            </p>
          )}
        </div>
      )}

        </div>
      </div>

      {/* Full width under both columns: changing status or deleting applies
          to the whole appointment, not to either side. */}
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
        Cambiar estado
      </h2>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            disabled={saving || apt.status === s}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 ${
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
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>


      <ShareAppointmentModal
        open={showShare}
        appointmentId={String(id)}
        clientName={apt.clientName ?? ""}
        service={apt.service ?? ""}
        preferredDate={apt.preferredDate}
        preferredTime={apt.preferredTime}
        onClose={() => setShowShare(false)}
        onShared={() => setReloadKey((k) => k + 1)}
      />

      <ClientLinkModal
        open={showLink}
        appointmentId={String(id)}
        clientName={apt.clientName ?? ""}
        clientEmail={apt.clientEmail ?? ""}
        clientPhone={apt.clientPhone}
        onClose={() => setShowLink(false)}
        onLinked={() => setReloadKey((k) => k + 1)}
      />

      <ConfirmDialog
        open={depositConfirm === "received"}
        title="Confirmar depósito recibido"
        message={`Confirma que ${apt.clientName} envió el depósito de $${String(depositAmount)} USD (referencia ${referenceCode}). La cita pasará a CONFIRMADA y se le enviará un correo de inmediato. Revisa tu Zelle antes de continuar.`}
        confirmLabel={depositSaving ? "Guardando..." : "Sí, recibí el depósito"}
        variant="success"
        busy={depositSaving}
        onConfirm={() => updateDeposit("received")}
        onCancel={() => setDepositConfirm(null)}
      />

      <ConfirmDialog
        open={depositConfirm === "unmark"}
        title="Quitar depósito"
        message="Esto devuelve el depósito a pendiente y la cita a PENDIENTE. Ahora no se envía ningún correo, pero si vuelves a marcarlo como recibido más adelante, la clienta recibirá el correo de confirmación por segunda vez."
        confirmLabel={depositSaving ? "Guardando..." : "Sí, quítalo"}
        busy={depositSaving}
        onConfirm={() => updateDeposit("unmark")}
        onCancel={() => setDepositConfirm(null)}
      />

      <ConfirmDialog
        open={showDelete}
        title="Eliminar cita"
        message="Esto elimina la cita y su registro de depósito de forma permanente. No se envía ningún correo a la clienta. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

/**
 * useSearchParams() opts a page out of static prerendering unless it sits under
 * a Suspense boundary — without this the production build fails outright.
 */
export default function AppointmentDetailPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--admin-muted)" }}>Cargando...</p>}>
      <AppointmentDetailPageInner />
    </Suspense>
  );
}
