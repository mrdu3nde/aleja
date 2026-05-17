"use client";

import type { LucideIcon } from "lucide-react";

type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type EmptyAction = {
  label: string;
  onClick: () => void;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: EmptyAction;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data found",
  emptyTitle,
  emptyDescription,
  emptyIcon: EmptyIcon,
  emptyAction,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: "56px 32px",
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
          textAlign: "center",
        }}
      >
        {EmptyIcon && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 9999,
              backgroundColor: "var(--admin-hover)",
              marginBottom: 16,
            }}
          >
            <EmptyIcon
              style={{ width: 28, height: 28, color: "var(--admin-muted)" }}
            />
          </div>
        )}
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--admin-text)",
            margin: 0,
            marginBottom: 6,
          }}
        >
          {emptyTitle ?? emptyMessage}
        </h3>
        {emptyDescription && (
          <p
            style={{
              fontSize: 14,
              color: "var(--admin-muted)",
              margin: 0,
              marginBottom: emptyAction ? 20 : 0,
              maxWidth: 360,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {emptyDescription}
          </p>
        )}
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 12,
              backgroundColor: "#6B4E3D",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#553D2F")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#6B4E3D")
            }
          >
            {emptyAction.label}
          </button>
        )}
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
