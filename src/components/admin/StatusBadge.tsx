import { STATUS_LABELS } from "@/lib/dates";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-[#D9CFC4] text-[#3A2E26]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        statusColors[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {/* The stored status is an English database value; the badge shows the
          Spanish label used everywhere else in the studio. */}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
