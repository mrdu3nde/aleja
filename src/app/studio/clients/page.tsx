"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Search, Trash2 } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { Pagination } from "@/components/admin/Pagination";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type Client = Record<string, unknown>;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    fetch(`/api/studio/clients?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setClients(res.data ?? []);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(console.error);
  }, [search, page, reloadKey]);

  // Reset to the first page as the term changes, rather than in an effect that
  // would render once against a stale page.
  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/studio/clients/${deleteTarget.id}`, { method: "DELETE" });
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>Clients</h1>
        <button
          onClick={() => router.push("/studio/clients/new")}
          className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Client
        </button>
      </div>

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={changeSearch}
          placeholder="Search by name, phone or email..."
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
          {
            key: "actions",
            label: "",
            // stopPropagation so deleting never opens the row underneath
            render: (row) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(row);
                }}
                aria-label={`Delete ${row.name as string}`}
                title={`Delete ${row.name as string}`}
                className="flex items-center justify-center px-3 py-2 rounded-xl cursor-pointer transition-colors"
                style={{ backgroundColor: "rgba(239,68,68,0.14)", color: "#f05252" }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
        data={clients}
        onRowClick={(row) => router.push(`/studio/clients/${row.id}`)}
        emptyIcon={search ? Search : Users}
        emptyTitle={
          search ? "No clients match your search" : "No clients yet"
        }
        emptyDescription={
          search
            ? `We couldn't find any clients matching "${search}". Try a different name or email.`
            : "Add your first client to start tracking their info, history, and bookings."
        }
        emptyAction={
          search
            ? undefined
            : {
                label: "+ Add Client",
                onClick: () => router.push("/studio/clients/new"),
              }
        }
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete client"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name as string}? Her appointments are kept — they simply stop being linked to a client record. This cannot be undone.`
            : ""
        }
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
