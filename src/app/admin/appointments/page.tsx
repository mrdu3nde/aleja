"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";

type Appointment = Record<string, unknown>;

const statusFilters = ["all", "pending", "confirmed", "cancelled", "completed"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status !== "all") params.set("status", status);
    fetch(`/api/admin/appointments?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setAppointments(res.data ?? []);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(console.error);
  }, [status, page]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>Appointments</h1>
        <button
          onClick={() => router.push("/admin/appointments/new")}
          className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </button>
      </div>

      {/* Status filters */}
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
          { key: "clientName", label: "Client" },
          { key: "service", label: "Service" },
          {
            key: "preferred_date",
            label: "Date",
            render: (row) => (row.preferred_date as string) ?? "TBD",
          },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge status={row.status as string} />,
          },
          { key: "source", label: "Source" },
        ]}
        data={appointments}
        onRowClick={(row) => router.push(`/admin/appointments/${row.id}`)}
        emptyMessage="No appointments found"
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
