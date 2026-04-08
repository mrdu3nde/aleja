"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Inbox,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/content", label: "Content", icon: FileText },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile hamburger - hidden on lg via CSS */}
      <style>{`
        .admin-mobile-btn { display: block; }
        @media (min-width: 1024px) { .admin-mobile-btn { display: none; } }
        .admin-sidebar { transform: translateX(-100%); }
        @media (min-width: 1024px) { .admin-sidebar { transform: translateX(0); } }
        .admin-sidebar.open { transform: translateX(0); }
        .admin-overlay { display: block; }
        @media (min-width: 1024px) { .admin-overlay { display: none; } }
      `}</style>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="admin-mobile-btn"
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 50,
          padding: 8,
          borderRadius: 8,
          backgroundColor: "#6B4E3D",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="admin-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 30,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar${mobileOpen ? " open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: 256,
          backgroundColor: "#6B4E3D",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          transition: "transform 0.2s",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: 20, borderBottom: "1px solid #553D2F" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Aluh</h1>
          <p style={{ fontSize: 12, color: "rgba(245,230,211,0.6)", marginTop: 2 }}>
            Admin Panel
          </p>
        </div>

        <nav style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                color: isActive(item.href) ? "#fff" : "rgba(245,230,211,0.7)",
                backgroundColor: isActive(item.href) ? "#553D2F" : "transparent",
              }}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: "1px solid #553D2F" }}>
          <ThemeToggle />
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(245,230,211,0.7)",
              background: "none",
              border: "none",
              width: "100%",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <LogOut size={20} />
            Back to Site
          </button>
        </div>
      </aside>
    </>
  );
}
