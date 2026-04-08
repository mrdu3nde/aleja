"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { key: "home", href: "" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "gallery", href: "/gallery" },
  { key: "book", href: "/book" },
  { key: "contact", href: "/contact" },
] as const;

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-cafe cursor-pointer"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full w-full bg-warm-white border-t border-mushroom/20 shadow-lg z-50">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg text-text-dark hover:bg-champagne/40 transition-colors font-medium"
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-2 px-4 pt-3 border-t border-mushroom/20">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
