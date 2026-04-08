"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[var(--admin-bg)] font-sans">
        <div className="w-full max-w-sm mx-4">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5E6D3]">
              <Lock className="h-7 w-7 text-[#6B4E3D]" />
            </div>
            <h1 className="text-2xl font-bold text-[#6B4E3D]">
              Aluh
            </h1>
            <p className="text-[var(--admin-muted)] text-sm mt-1">Admin Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input)] px-4 py-3 text-[var(--admin-text)] placeholder:text-[var(--admin-placeholder)] focus:border-[#6B4E3D] focus:ring-1 focus:ring-[#6B4E3D] outline-none transition-colors"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-xl bg-[#6B4E3D] text-white py-3 font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </body>
    </html>
  );
}
