import type { ReactNode } from "react";
import { DM_Sans } from "next/font/google";
import "../globals.css";
import { Sidebar } from "@/components/admin/Sidebar";
import { ThemeProvider } from "@/components/admin/ThemeProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Admin — Aluh",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable} data-admin-theme="dark">
      <body
        className="min-h-screen antialiased"
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--admin-bg)",
          color: "var(--admin-text)",
        }}
      >
        <ThemeProvider>
          <Sidebar />
          <main className="lg:ml-64 min-h-screen">
            <div className="p-6 pt-16 lg:pt-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
