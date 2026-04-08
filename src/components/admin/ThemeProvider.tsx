"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeCtx = { dark: boolean; toggle: () => void };
const Ctx = createContext<ThemeCtx>({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme");
    if (saved === "light") setDark(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-theme", dark ? "dark" : "light");
    document.documentElement.setAttribute("data-admin-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Ctx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </Ctx.Provider>
  );
}
