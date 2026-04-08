"use client";

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: 48,
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
          textAlign: "center",
          color: "var(--admin-muted)",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 16,
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "12px 20px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--admin-muted)",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: i < data.length - 1 ? "1px solid var(--admin-border)" : undefined,
                  cursor: onRowClick ? "pointer" : undefined,
                  color: "var(--admin-text)",
                }}
                onMouseEnter={(e) => onRowClick && (e.currentTarget.style.backgroundColor = "var(--admin-hover)")}
                onMouseLeave={(e) => onRowClick && (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: "16px 20px", fontSize: 14 }}>
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as React.ReactNode) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
