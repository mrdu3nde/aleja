"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
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
      {dark ? <Sun size={20} /> : <Moon size={20} />}
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
