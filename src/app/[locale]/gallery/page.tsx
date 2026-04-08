"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import { motion, AnimatePresence } from "framer-motion";

const filters = ["all", "hair", "nails", "brows", "lashes"] as const;

// Placeholder gallery items — replace with real data
const galleryItems = [
  { id: 1, category: "hair" },
  { id: 2, category: "nails" },
  { id: 3, category: "brows" },
  { id: 4, category: "lashes" },
  { id: 5, category: "hair" },
  { id: 6, category: "nails" },
  { id: 7, category: "brows" },
  { id: 8, category: "hair" },
  { id: 9, category: "lashes" },
  { id: 10, category: "nails" },
  { id: 11, category: "hair" },
  { id: 12, category: "brows" },
];

export default function GalleryPage() {
  const t = useTranslations("gallery_page");
  const [active, setActive] = useState<(typeof filters)[number]>("all");

  const filtered =
    active === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === active);

  return (
    <>
      <section className="bg-gradient-to-br from-champagne-light to-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-cafe mb-4"
          >
            {t("title")}
          </motion.h1>
          <p className="text-text-light text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
      </section>

      <Section bg="white">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                active === f
                  ? "bg-cafe text-white"
                  : "bg-mushroom-light/50 text-text-dark hover:bg-mushroom-light"
              }`}
            >
              {t(`filter_${f}`)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="aspect-square rounded-xl bg-gradient-to-br from-champagne to-mushroom-light flex items-center justify-center"
              >
                <span className="text-cafe/30 text-xs capitalize">
                  {item.category}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Section>
    </>
  );
}
