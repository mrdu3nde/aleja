"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
        style={{ color: "var(--admin-text)" }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--admin-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm" style={{ color: "var(--admin-muted)" }}>
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
        style={{ color: "var(--admin-text)" }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--admin-hover)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
