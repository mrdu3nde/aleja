"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const newLocale = locale === "en" ? "es" : "en";
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 text-sm font-medium text-cafe hover:text-cafe-dark transition-colors cursor-pointer"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      <span>{locale === "en" ? "ES" : "EN"}</span>
    </button>
  );
}
