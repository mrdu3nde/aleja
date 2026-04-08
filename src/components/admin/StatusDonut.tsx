"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Props = {
  data: { pending: number; confirmed: number; completed: number; cancelled: number };
};

const COLORS: Record<string, { fill: string; label: string }> = {
  pending: { fill: "#F59E0B", label: "Pending" },
  confirmed: { fill: "#2563EB", label: "Confirmed" },
  completed: { fill: "#10B981", label: "Completed" },
  cancelled: { fill: "#EF4444", label: "Cancelled" },
};

export function StatusDonut({ data }: Props) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: COLORS[key].label,
      value,
      color: COLORS[key].fill,
    }));

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: 200, color: "var(--admin-muted)" }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "3px dashed var(--admin-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <span className="text-xs">No data</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "var(--admin-text)",
              lineHeight: 1,
            }}
          >
            {total}
          </span>
          <span
            style={{ fontSize: 10, color: "var(--admin-muted)" }}
          >
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {Object.entries(COLORS).map(([key, { fill, label }]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: fill,
                flexShrink: 0,
              }}
            />
            <span className="text-xs" style={{ color: "var(--admin-muted)" }}>
              {label}
            </span>
            <span
              className="text-xs font-semibold ml-auto"
              style={{ color: "var(--admin-text)" }}
            >
              {data[key as keyof typeof data]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
