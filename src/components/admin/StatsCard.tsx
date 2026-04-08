import type { LucideIcon } from "lucide-react";

type StatsCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
};

export function StatsCard({ label, value, icon: Icon }: StatsCardProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 24,
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: "rgba(107,78,61,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={24} style={{ color: "#F5E6D3" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, color: "var(--admin-muted)" }}>{label}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--admin-text)" }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
