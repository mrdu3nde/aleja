"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { AtSign, Mail, Phone } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const locale = useLocale();

  const quickLinks = [
    { key: "home", href: "" },
    { key: "about", href: "/about" },
    { key: "services", href: "/services" },
    { key: "gallery", href: "/gallery" },
    { key: "book", href: "/book" },
    { key: "faq", href: "/faq" },
    { key: "policies", href: "/policies" },
  ] as const;

  return (
    <footer className="bg-cafe text-champagne">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white mb-3">
              Aluh
            </h3>
            <p className="text-champagne/80 text-sm leading-relaxed">
              {t("brand_description")}
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                className="text-champagne/70 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <AtSign className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact.aluh@gmail.com"
                className="text-champagne/70 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {t("quick_links")}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={`/${locale}${item.href}`}
                    className="text-sm text-champagne/70 hover:text-white transition-colors"
                  >
                    {nav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {t("hours_title")}
            </h4>
            <ul className="space-y-2 text-sm text-champagne/70">
              <li>{t("hours.mon_fri")}</li>
              <li>{t("hours.saturday")}</li>
              <li>{t("hours.sunday")}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {t("contact_title")}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:contact.aluh@gmail.com"
                  className="flex items-center gap-2 text-champagne/70 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  contact.aluh@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+15550000000"
                  className="flex items-center gap-2 text-champagne/70 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  +1 (555) 000-0000
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-champagne/15 text-center text-sm text-champagne/50">
          &copy; {new Date().getFullYear()} Aluh. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
