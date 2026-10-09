"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "es", label: "ES", name: "Español" },
  { code: "en", label: "EN", name: "English" },
] as const;

/**
 * ES | EN, los dos a la vista, para que se note que existe la otra versión.
 * Cambia sólo el idioma de la ruta: la clienta se queda en la misma página
 * (y con lo que traía en la URL, como el servicio elegido).
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (code: string) => {
    if (code === locale) return;
    const segments = pathname.split("/");
    segments[1] = code;
    router.push(segments.join("/") + window.location.search);
  };

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-cafe">
      <Globe className="h-4 w-4" aria-hidden />
      <div className="flex rounded-full border border-cafe/30 p-0.5">
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => switchTo(l.code)}
              aria-pressed={active}
              aria-label={l.name}
              lang={l.code}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${
                active ? "bg-cafe text-white" : "text-cafe hover:bg-champagne-light"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
