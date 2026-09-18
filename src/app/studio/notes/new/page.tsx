import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NoteCapture } from "@/components/admin/NoteCapture";

export const metadata = {
  title: "Nueva nota — Aluh",
};

export default function NewNotePage() {
  return (
    <div>
      <Link
        href="/studio/notes"
        className="inline-flex items-center gap-2 text-sm mb-4"
        style={{ color: "var(--admin-muted)", textDecoration: "none" }}
      >
        <ArrowLeft size={16} />
        Mis notas
      </Link>

      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--admin-text)" }}
      >
        Nueva nota
      </h1>

      <NoteCapture />
    </div>
  );
}
