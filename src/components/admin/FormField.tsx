import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--admin-text)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ marginTop: 4, fontSize: 12, color: "#f87171" }}>{error}</p>}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--admin-input-border)",
  backgroundColor: "var(--admin-input)",
  padding: "12px 16px",
  color: "var(--admin-text)",
  outline: "none",
  fontSize: 14,
};

// Keep className version for react-hook-form register compatibility
export const inputClass =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors"
  + " focus:ring-1 focus:ring-[#6B4E3D]";
