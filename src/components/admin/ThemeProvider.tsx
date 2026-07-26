"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeCtx = { dark: boolean; toggle: () => void };
const Ctx = createContext<ThemeCtx>({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read the stored preference during initialisation instead of in an effect,
  // which would render the wrong theme once and then flip it.
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("admin-theme") !== "light";
  });

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
