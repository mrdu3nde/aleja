const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-[#D9CFC4] text-[#3A2E26]",
  new: "bg-[#F5E6D3] text-[#6B4E3D]",
  contacted: "bg-blue-100 text-blue-700",
  converted: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}
