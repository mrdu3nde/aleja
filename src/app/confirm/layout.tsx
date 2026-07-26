import type { ReactNode } from "react";
import { DM_Sans } from "next/font/google";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Confirma tu cita — Aluh",
  // A shared link should never end up in search results
  robots: { index: false, follow: false },
};

export default function ConfirmLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body className="antialiased" style={{ fontFamily: "var(--font-body)" }}>
        {children}
      </body>
    </html>
  );
}
