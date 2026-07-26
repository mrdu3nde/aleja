"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, UserPlus, Link2, X, Sparkles, AlertCircle } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import { formatDay } from "@/lib/dates";

type Client = Record<string, unknown>;

type Props = {
  open: boolean;
  appointmentId: string;
  /** Booking details, used to prefill the "create client" path. */
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  onClose: () => void;
  onLinked: () => void;
};

function matchLabel(matchedOn: unknown) {
  if (matchedOn === "both") return "same email and phone";
  if (matchedOn === "email") return "same email";
  return "same phone";
}

function ClientRow({
  client,
  suggested,
  busy,
  onLink,
}: {
  client: Client;
  suggested?: boolean;
  busy: boolean;
  onLink: () => void;
}) {
  const count = (client._count as { appointments?: number } | undefined)?.appointments ?? 0;
  const last = (client.appointments as Array<{ preferredDate?: string | null }> | undefined)?.[0];

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl"
      style={{
        border: suggested ? "1px solid #6B4E3D" : "1px solid var(--admin-border)",
        backgroundColor: suggested ? "rgba(107,78,61,0.06)" : "transparent",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate" style={{ color: "var(--admin-text)" }}>
            {client.name as string}
          </span>
          {suggested && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: "#6B4E3D", color: "#fff" }}
            >
              <Sparkles className="h-3 w-3" />
              {matchLabel(client.matchedOn)}
            </span>
          )}
        </div>
        <p className="text-sm truncate" style={{ color: "var(--admin-muted)" }}>
          {formatPhone(client.phone as string | null)} · {client.email as string}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--admin-muted)" }}>
          {count} {count === 1 ? "appointment" : "appointments"}
          {last?.preferredDate ? ` · last ${formatDay(last.preferredDate)}` : ""}
        </p>
      </div>
      <button
        onClick={onLink}
        disabled={busy}
        className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-[#6B4E3D] text-white px-4 py-2 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer disabled:opacity-40"
        style={{ minHeight: 40 }}
      >
        <Link2 className="h-4 w-4" />
        Link
      </button>
    </div>
  );
}

export function ClientLinkModal({
  open,
  appointmentId,
  clientName,
  clientEmail,
  clientPhone,
  onClose,
  onLinked,
}: Props) {
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<Client[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions depend only on the appointment, so they load once per open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/studio/appointments/${appointmentId}/client-matches`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) setMatches(res.data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "25" });
        if (search) params.set("search", search);
        const res = await fetch(`/api/studio/clients?${params}`).then((r) => r.json());
        if (!cancelled) setClients(res.data ?? []);
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, search ? 250 : 0); // debounce typing
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, search]);

  // Escape to dismiss — the modal covers the whole screen, it needs a keyboard exit.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const link = useCallback(
    async (clientId: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/studio/appointments/${appointmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });
        if (!res.ok) throw new Error();
        onLinked();
        onClose();
      } catch {
        setError("Could not link the client. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [appointmentId, onLinked, onClose],
  );

  const createAndLink = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          phone: clientPhone || undefined,
        }),
      });

      // Someone already owns that email — link to them instead of failing.
      if (res.status === 409) {
        const { client } = await res.json();
        await link(client.id);
        return;
      }
      if (!res.ok) throw new Error();

      const created = await res.json();
      await link(created.id);
    } catch {
      setError("Could not create the client. Check the email is valid.");
      setBusy(false);
    }
  }, [clientName, clientEmail, clientPhone, link]);

  if (!open) return null;

  const matchIds = new Set(matches.map((m) => m.id as string));
  const rest = clients.filter((c) => !matchIds.has(c.id as string));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Link appointment to a client"
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl w-full max-w-lg shadow-xl flex flex-col"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 pb-4"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
              Link to client
            </h3>
            <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
              Booked as {clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg cursor-pointer"
            style={{ color: "var(--admin-muted)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5 pb-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--admin-placeholder)" }}
            />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to find a client..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              name="client-typeahead"
              data-lpignore="true"
              data-1p-ignore=""
              data-form-type="other"
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#6B4E3D]"
              style={{
                border: "1px solid var(--admin-input-border)",
                backgroundColor: "var(--admin-input)",
                color: "var(--admin-text)",
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-sm"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#B91C1C" }}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {matches.length > 0 && !search && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--admin-muted)" }}
              >
                Suggested {matches.length === 1 ? "match" : "matches"}
              </p>
              <div className="space-y-2">
                {matches.map((c) => (
                  <ClientRow
                    key={c.id as string}
                    client={c}
                    suggested
                    busy={busy}
                    onLink={() => link(c.id as string)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            {matches.length > 0 && !search && (
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--admin-muted)" }}
              >
                All clients
              </p>
            )}
            {loading ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--admin-muted)" }}>
                Loading...
              </p>
            ) : rest.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--admin-muted)" }}>
                {search ? `No client matches "${search}".` : "No clients yet."}
              </p>
            ) : (
              <div className="space-y-2">
                {rest.map((c) => (
                  <ClientRow
                    key={c.id as string}
                    client={c}
                    busy={busy}
                    onLink={() => link(c.id as string)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create escape hatch */}
        <div className="p-5 pt-3" style={{ borderTop: "1px solid var(--admin-border)" }}>
          <button
            onClick={createAndLink}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors disabled:opacity-40"
            style={{ border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
          >
            <UserPlus className="h-4 w-4" />
            {busy ? "Working..." : "Not here — create client from this booking"}
          </button>
          <p className="text-xs mt-2 text-center" style={{ color: "var(--admin-muted)" }}>
            Uses {clientName} · {clientEmail}
            {clientPhone ? ` · ${formatPhone(clientPhone)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
