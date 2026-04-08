"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";

type Lead = Record<string, unknown>;

const statusFilters = ["all", "new", "contacted", "converted", "archived"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status !== "all") params.set("status", status);
    fetch(`/api/admin/leads?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setLeads(res.data ?? []);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(console.error);
  }, [status, page]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--admin-text)" }}>Leads</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors cursor-pointer ${
              status === s ? "bg-[#6B4E3D] text-white" : ""
            }`}
            style={
              status === s
                ? undefined
                : { backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }
            }
            onMouseEnter={(e) => {
              if (status !== s) e.currentTarget.style.backgroundColor = "var(--admin-filter-hover)";
            }}
            onMouseLeave={(e) => {
              if (status !== s) e.currentTarget.style.backgroundColor = "var(--admin-filter-bg)";
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          {
            key: "message",
            label: "Message",
            render: (row) => (
              <span className="truncate max-w-[200px] block" style={{ color: "var(--admin-muted)" }}>
                {row.message as string}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge status={row.status as string} />,
          },
          {
            key: "createdAt",
            label: "Date",
            render: (row) =>
              new Date(row.createdAt as string).toLocaleDateString(),
          },
        ]}
        data={leads}
        onRowClick={(row) => router.push(`/admin/leads/${row.id}`)}
        emptyMessage="No leads found"
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
