"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: Array<{ day: string; count: number }>;
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--admin-text)" }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: "var(--admin-muted)" }}>
        {payload[0].value} appointment{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function WeeklyChart({ data }: Props) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 200, color: "var(--admin-muted)" }}
      >
        <p className="text-sm">No appointments this week yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--admin-border)"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--admin-muted)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--admin-muted)", fontSize: 12 }}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--admin-hover)" }} />
        <Bar
          dataKey="count"
          fill="#6B4E3D"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
