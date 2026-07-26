import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/about": {
      en: "/about",
      es: "/sobre",
    },
    "/services": {
      en: "/services",
      es: "/servicios",
    },
    "/gallery": {
      en: "/gallery",
      es: "/galeria",
    },
    "/book": {
      en: "/book",
      es: "/reservar",
    },
    "/faq": "/faq",
    "/policies": {
      en: "/policies",
      es: "/politicas",
    },
  },
});
