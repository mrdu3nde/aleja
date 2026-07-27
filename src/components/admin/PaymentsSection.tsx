"use client";

import { useState } from "react";
import { Wallet, Plus, Trash2, Check } from "lucide-react";
import { computeBalance } from "@/lib/balance";

type Payment = {
  id: string;
  amount: string | number;
  method: string;
  note?: string | null;
  createdAt: string;
};

type Props = {
  appointmentId: string;
  servicePrice?: string | number | null;
  depositRequired?: boolean;
  depositAmount?: string | number | null;
  depositStatus?: string;
  payments: Payment[];
  /** A cancelled booking still shows what was collected, but takes no more. */
  cancelled?: boolean;
  onChanged: () => void;
};

const METHODS = [
  { key: "cash", label: "Efectivo" },
  { key: "zelle", label: "Zelle" },
  { key: "card", label: "Tarjeta" },
  { key: "transfer", label: "Transferencia" },
  { key: "other", label: "Otro" },
] as const;

const money = (n: number) => `$${n.toFixed(2)}`;

export function PaymentsSection({
  appointmentId,
  servicePrice,
  depositRequired,
  depositAmount,
  depositStatus,
  payments,
  cancelled,
  onChanged,
}: Props) {
  const [priceDraft, setPriceDraft] = useState(
    servicePrice != null ? String(Number(servicePrice)) : "",
  );
  const [savingPrice, setSavingPrice] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const balance = computeBalance({
    servicePrice,
    depositRequired,
    depositAmount,
    depositStatus,
    payments,
  });

  const savePrice = async () => {
    setSavingPrice(true);
    await fetch(`/api/studio/appointments/${appointmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicePrice: Number(priceDraft) || 0 }),
    });
    setSavingPrice(false);
    onChanged();
  };

  const addPayment = async (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    await fetch(`/api/studio/appointments/${appointmentId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: value, method, note: note || undefined }),
    });
    setAmount("");
    setNote("");
    setSaving(false);
    onChanged();
  };

  const removePayment = async (paymentId: string) => {
    await fetch(`/api/studio/appointments/${appointmentId}/payments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    onChanged();
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
        <Wallet className="h-5 w-5" />
        Pagos
      </h2>

      {/* Service price */}
      <div className="mb-5">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--admin-muted)" }}>
          Precio del servicio
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--admin-muted)" }}>
              $
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#6B4E3D]"
              style={{
                border: "1px solid var(--admin-input-border)",
                backgroundColor: "var(--admin-input)",
                color: "var(--admin-text)",
              }}
            />
          </div>
          <button
            onClick={savePrice}
            disabled={
              cancelled ||
              savingPrice ||
              priceDraft === (servicePrice != null ? String(Number(servicePrice)) : "")
            }
            className="shrink-0 px-4 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-40 transition-colors"
            style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }}
          >
            {savingPrice ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Ledger */}
      {balance.hasPrice ? (
        <div
          className="rounded-xl p-4 mb-5 space-y-2"
          style={{ backgroundColor: "var(--admin-filter-bg)" }}
        >
          <Line label="Precio del servicio" value={money(balance.total)} />
          {balance.depositPaid > 0 && (
            <Line label="Depósito recibido" value={`− ${money(balance.depositPaid)}`} muted />
          )}
          {balance.paid > 0 && (
            <Line label="Pagos" value={`− ${money(balance.paid)}`} muted />
          )}
          <div style={{ borderTop: "1px solid var(--admin-border)" }} className="pt-2">
            {balance.settled ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#166534" }}>
                  <Check className="h-4 w-4" />
                  Pagado completo
                </span>
                {balance.change > 0 && (
                  <span className="text-sm" style={{ color: "var(--admin-muted)" }}>
                    vuelto {money(balance.change)}
                  </span>
                )}
              </div>
            ) : (
              <Line label="Saldo pendiente" value={money(balance.remaining)} strong />
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm mb-5" style={{ color: "var(--admin-muted)" }}>
Pon el precio del servicio para llevar la cuenta de lo que falta.
        </p>
      )}

      {/* Existing payments */}
      {payments.length > 0 && (
        <div className="mb-5 space-y-2">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 text-sm py-2"
              style={{ borderBottom: "1px solid var(--admin-border)" }}
            >
              <span className="font-medium" style={{ color: "var(--admin-text)" }}>
                {money(Number(p.amount))}
              </span>
              <span className="capitalize" style={{ color: "var(--admin-muted)" }}>
                {p.method}
              </span>
              {p.note && (
                <span className="truncate text-xs" style={{ color: "var(--admin-muted)" }}>
                  {p.note}
                </span>
              )}
              <span className="ml-auto text-xs shrink-0" style={{ color: "var(--admin-muted)" }}>
                {new Date(p.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => removePayment(p.id)}
                aria-label="Eliminar pago"
                className="shrink-0 text-red-600 hover:text-red-700 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {cancelled && (
        <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
          Esta cita está cancelada. Lo que ya cobraste queda registrado, pero no
          se puede agregar ningún pago nuevo.
        </p>
      )}

      {/* Record a payment */}
      {!balance.settled && !cancelled && (
        <>
          {balance.remaining > 0 && (
            <button
              onClick={() => addPayment(balance.remaining)}
              disabled={saving}
              className="w-full mb-3 flex items-center justify-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#553D2F] transition-colors cursor-pointer disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              {saving ? "Guardando..." : `Cobrar el resto: ${money(balance.remaining)}`}
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--admin-muted)" }}>
                $
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Abono parcial"
                className="w-full rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#6B4E3D]"
                style={{
                  border: "1px solid var(--admin-input-border)",
                  backgroundColor: "var(--admin-input)",
                  color: "var(--admin-text)",
                }}
              />
            </div>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm cursor-pointer outline-none"
              style={{
                border: "1px solid var(--admin-input-border)",
                backgroundColor: "var(--admin-input)",
                color: "var(--admin-text)",
              }}
            >
              {METHODS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => addPayment(Number(amount))}
              disabled={saving || !amount || Number(amount) <= 0}
              className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer disabled:opacity-40 transition-colors"
              style={{ border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-full mt-2 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#6B4E3D]"
            style={{
              border: "1px solid var(--admin-input-border)",
              backgroundColor: "var(--admin-input)",
              color: "var(--admin-text)",
            }}
          />
        </>
      )}
    </div>
  );
}

function Line({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--admin-muted)" }}>
        {label}
      </span>
      <span
        className={strong ? "text-lg font-bold" : "text-sm font-medium"}
        style={{ color: muted ? "var(--admin-muted)" : "var(--admin-text)" }}
      >
        {value}
      </span>
    </div>
  );
}
