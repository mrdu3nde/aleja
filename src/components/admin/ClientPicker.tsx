"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, User } from "lucide-react";
import { formatPhone } from "@/lib/phone";

type Client = Record<string, unknown>;

/**
 * Type-ahead over existing clients. Picking one fills the booking fields, so
 * the owner never retypes a phone she already has on file.
 */
export function ClientPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: Client | null;
  onSelect: (client: Client) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "8" });
        if (query) params.set("search", query);
        const res = await fetch(`/api/studio/clients?${params}`).then((r) => r.json());
        if (!cancelled) setResults(res.data ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  // click outside closes the dropdown
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (selected) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ border: "1px solid #6B4E3D", backgroundColor: "rgba(107,78,61,0.06)" }}
      >
        <User className="h-4 w-4 shrink-0" style={{ color: "#6B4E3D" }} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: "var(--admin-text)" }}>
            {selected.name as string}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--admin-muted)" }}>
            {formatPhone(selected.phone as string | null)}
            {selected.email ? ` · ${selected.email as string}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Quitar clienta seleccionada"
          className="p-1.5 rounded-lg cursor-pointer shrink-0"
          style={{ color: "var(--admin-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: "var(--admin-placeholder)" }}
      />
      <input
        type="text"
        value={query}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        // Chrome guesses "name/email" from the placeholder and stacks its own
        // autofill list on top of ours. An unrecognised name plus these vendor
        // opt-outs keeps the browser and password managers out of the way.
        name="client-typeahead"
        data-lpignore="true"
        data-1p-ignore=""
        data-form-type="other"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="client-typeahead-list"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Escribe para buscar una clienta..."
        className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#6B4E3D]"
        style={{
          border: "1px solid var(--admin-input-border)",
          backgroundColor: "var(--admin-input)",
          color: "var(--admin-text)",
        }}
      />

      {open && (
        <div
          id="client-typeahead-list"
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-lg"
          style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
        >
          {loading ? (
            <p className="text-sm p-3" style={{ color: "var(--admin-muted)" }}>
              Cargando...
            </p>
          ) : results.length === 0 ? (
            <p className="text-sm p-3" style={{ color: "var(--admin-muted)" }}>
              {query ? "Sin coincidencias — llena los campos de abajo para crear una." : "Aún no tienes clientas."}
            </p>
          ) : (
            results.map((c) => (
              <button
                key={c.id as string}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left p-3 cursor-pointer transition-colors"
                style={{ color: "var(--admin-text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--admin-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <p className="text-sm font-medium truncate">{c.name as string}</p>
                <p className="text-xs truncate" style={{ color: "var(--admin-muted)" }}>
                  {formatPhone(c.phone as string | null)}
                  {c.email ? ` · ${c.email as string}` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
