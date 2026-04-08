"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Inbox,
  FileText,
  ExternalLink,
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
          padding: 10,
          borderRadius: 10,
          backgroundColor: "#6B4E3D",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(107,78,61,0.3)",
        }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="admin-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 30,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      <aside
        className={`admin-sidebar${mobileOpen ? " open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: 256,
          background: "linear-gradient(180deg, #6B4E3D 0%, #553D2F 100%)",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          transition: "transform 0.2s",
          overflowY: "auto",
        }}
      >
        {/* Brand */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #F5E6D3, #D9CFC4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 16,
                color: "#553D2F",
              }}
            >
              A
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>Aluh</h1>
              <p style={{ fontSize: 11, color: "rgba(245,230,211,0.5)", marginTop: 2 }}>
                Beauty Studio
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(245,230,211,0.35)",
              padding: "8px 12px 6px",
            }}
          >
            Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                  color: active ? "#fff" : "rgba(245,230,211,0.65)",
                  backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(245,230,211,0.9)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(245,230,211,0.65)";
                  }
                }}
              >
                <item.icon size={18} />
                {item.label}
                {active && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#F5E6D3",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <ThemeToggle />
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 400,
              color: "rgba(245,230,211,0.55)",
              background: "none",
              border: "none",
              width: "100%",
              cursor: "pointer",
              textAlign: "left",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,230,211,0.9)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,230,211,0.55)")}
          >
            <ExternalLink size={18} />
            View Website
          </button>
        </div>
      </aside>
    </>
  );
}
