"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { Pagination } from "@/components/admin/Pagination";

type Client = Record<string, unknown>;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    fetch(`/api/admin/clients?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setClients(res.data ?? []);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(console.error);
  }, [search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>Clients</h1>
        <button
          onClick={() => router.push("/admin/clients/new")}
          className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Client
        </button>
      </div>

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
        />
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          {
            key: "createdAt",
            label: "Added",
            render: (row) =>
              new Date(row.createdAt as string).toLocaleDateString(),
          },
        ]}
        data={clients}
        onRowClick={(row) => router.push(`/admin/clients/${row.id}`)}
        emptyMessage="No clients found"
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
