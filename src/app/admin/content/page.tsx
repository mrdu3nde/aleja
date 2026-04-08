"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Globe } from "lucide-react";

type SectionDef = { key: string; label: string; keys: string[] };

const sections: SectionDef[] = [
  {
    key: "hero",
    label: "Hero Section",
    keys: ["hero.headline", "hero.subheadline"],
  },
  {
    key: "trust",
    label: "Trust Pillars",
    keys: [
      "trust.title",
      "trust.personalized",
      "trust.personalized_desc",
      "trust.quality",
      "trust.quality_desc",
      "trust.results",
      "trust.results_desc",
      "trust.experience",
      "trust.experience_desc",
    ],
  },
  {
    key: "services",
    label: "Services",
    keys: [
      "services_section.title",
      "services_section.subtitle",
      "services_section.hair.title",
      "services_section.hair.description",
      "services_section.nails.title",
      "services_section.nails.description",
      "services_section.brows.title",
      "services_section.brows.description",
      "services_section.lashes.title",
      "services_section.lashes.description",
      "services_section.facial.title",
      "services_section.facial.description",
      "services_section.special.title",
      "services_section.special.description",
    ],
  },
  {
    key: "about",
    label: "About",
    keys: [
      "about_preview.title",
      "about_preview.text",
      "about_page.title",
      "about_page.intro",
      "about_page.story",
      "about_page.philosophy",
      "about_page.commitment",
    ],
  },
  {
    key: "booking",
    label: "Booking CTA",
    keys: ["booking_cta.title", "booking_cta.subtitle"],
  },
];

function keyToLabel(key: string): string {
  const parts = key.split(".");
  const last = parts[parts.length - 1];
  return last
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Default values from the message files
const defaults: Record<string, Record<string, string>> = {
  en: {
    "hero.headline": "Reveal Your Best Look with Confidence",
    "hero.subheadline": "Personalized beauty services designed to make you feel cared for, confident, and radiant.",
    "trust.title": "Why Choose Aluh",
    "trust.personalized": "Personalized Attention",
    "trust.personalized_desc": "Every service is tailored to your unique style and needs.",
    "trust.quality": "Quality Service",
    "trust.quality_desc": "Premium products and techniques for beautiful, lasting results.",
    "trust.results": "Beautiful Results",
    "trust.results_desc": "Attention to detail that ensures you leave feeling your best.",
    "trust.experience": "Comfortable Experience",
    "trust.experience_desc": "A warm, welcoming space where you can relax and enjoy.",
    "services_section.title": "Our Services",
    "services_section.subtitle": "Each service is thoughtfully designed to highlight your natural beauty.",
    "services_section.hair.title": "Hair",
    "services_section.hair.description": "Color, cuts, styling, and treatments to transform and maintain your hair.",
    "services_section.nails.title": "Nails",
    "services_section.nails.description": "Manicures, pedicures, gel, acrylic, and nail art for every occasion.",
    "services_section.brows.title": "Brows",
    "services_section.brows.description": "Shaping, tinting, lamination, and microblading for perfectly defined brows.",
    "services_section.lashes.title": "Lashes",
    "services_section.lashes.description": "Extensions, lifts, and tinting for effortlessly stunning lashes.",
    "services_section.facial.title": "Facial Treatments",
    "services_section.facial.description": "Cleansing, hydration, and rejuvenation for healthy, glowing skin.",
    "services_section.special.title": "Special Services",
    "services_section.special.description": "Bridal packages, event prep, and signature beauty experiences.",
    "about_preview.title": "Meet Aluh",
    "about_preview.text": "With a passion for beauty and a commitment to personalized care, Aluh creates an experience where every client feels seen, valued, and beautiful.",
    "about_page.title": "About Aluh",
    "about_page.intro": "More than a beauty service — a personalized experience built on trust, care, and attention to detail.",
    "about_page.story": "Beauty has always been my passion. From a young age, I was drawn to the art of enhancing natural features and helping people feel confident in their own skin.",
    "about_page.philosophy": "I believe beauty should feel effortless, personal, and empowering. Every service I offer is guided by this principle.",
    "about_page.commitment": "Your trust means everything. I am committed to providing an experience that not only meets your expectations but exceeds them.",
    "booking_cta.title": "Ready to Book Your Next Beauty Appointment?",
    "booking_cta.subtitle": "Let's create something beautiful together. Book your session today.",
  },
  es: {
    "hero.headline": "Revela Tu Mejor Versi\u00f3n con Confianza",
    "hero.subheadline": "Servicios de belleza personalizados dise\u00f1ados para que te sientas cuidada, segura y radiante.",
    "trust.title": "\u00bfPor Qu\u00e9 Elegir Aluh?",
    "trust.personalized": "Atenci\u00f3n Personalizada",
    "trust.personalized_desc": "Cada servicio est\u00e1 adaptado a tu estilo y necesidades \u00fanicas.",
    "trust.quality": "Servicio de Calidad",
    "trust.quality_desc": "Productos y t\u00e9cnicas premium para resultados hermosos y duraderos.",
    "trust.results": "Resultados Hermosos",
    "trust.results_desc": "Atenci\u00f3n al detalle que asegura que te vayas sinti\u00e9ndote incre\u00edble.",
    "trust.experience": "Experiencia C\u00f3moda",
    "trust.experience_desc": "Un espacio c\u00e1lido y acogedor donde puedes relajarte y disfrutar.",
    "services_section.title": "Nuestros Servicios",
    "services_section.subtitle": "Cada servicio est\u00e1 cuidadosamente dise\u00f1ado para resaltar tu belleza natural.",
    "services_section.hair.title": "Cabello",
    "services_section.hair.description": "Color, cortes, peinados y tratamientos para transformar y mantener tu cabello.",
    "services_section.nails.title": "U\u00f1as",
    "services_section.nails.description": "Manicura, pedicura, gel, acr\u00edlico y nail art para cada ocasi\u00f3n.",
    "services_section.brows.title": "Cejas",
    "services_section.brows.description": "Dise\u00f1o, tinte, laminado y microblading para cejas perfectamente definidas.",
    "services_section.lashes.title": "Pesta\u00f1as",
    "services_section.lashes.description": "Extensiones, lifting y tinte para pesta\u00f1as deslumbrantes sin esfuerzo.",
    "services_section.facial.title": "Tratamientos Faciales",
    "services_section.facial.description": "Limpieza, hidrataci\u00f3n y rejuvenecimiento para una piel sana y luminosa.",
    "services_section.special.title": "Servicios Especiales",
    "services_section.special.description": "Paquetes nupciales, preparaci\u00f3n para eventos y experiencias de belleza exclusivas.",
    "about_preview.title": "Conoce a Aluh",
    "about_preview.text": "Con pasi\u00f3n por la belleza y un compromiso con el cuidado personalizado, Aluh crea una experiencia donde cada clienta se siente vista, valorada y hermosa.",
    "about_page.title": "Sobre Aluh",
    "about_page.intro": "M\u00e1s que un servicio de belleza \u2014 una experiencia personalizada construida sobre confianza, cuidado y atenci\u00f3n al detalle.",
    "about_page.story": "La belleza siempre ha sido mi pasi\u00f3n. Desde joven, me atrajo el arte de realzar los rasgos naturales y ayudar a las personas a sentirse seguras en su propia piel.",
    "about_page.philosophy": "Creo que la belleza debe sentirse natural, personal y empoderadora. Cada servicio que ofrezco est\u00e1 guiado por este principio.",
    "about_page.commitment": "Tu confianza lo es todo. Me comprometo a ofrecer una experiencia que no solo cumpla tus expectativas sino que las supere.",
    "booking_cta.title": "\u00bfLista para Tu Pr\u00f3xima Cita de Belleza?",
    "booking_cta.subtitle": "Creemos algo hermoso juntas. Reserva tu sesi\u00f3n hoy.",
  },
};

const contentInputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--admin-input-border)",
  backgroundColor: "var(--admin-input)",
  padding: "12px 16px",
  fontSize: 14,
  color: "var(--admin-text)",
  outline: "none",
};

export default function ContentPage() {
  const [locale, setLocale] = useState("en");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSection, setOpenSection] = useState<string>("hero");

  useEffect(() => {
    fetch(`/api/admin/content?locale=${locale}`)
      .then((r) => r.json())
      .then((dbValues: Record<string, string>) => {
        // Merge: DB values override defaults
        const merged = { ...defaults[locale], ...dbValues };
        setValues(merged);
      })
      .catch(console.error);
  }, [locale]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, entries: values }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isLong = (key: string) =>
    key.includes("desc") ||
    key.includes("text") ||
    key.includes("subheadline") ||
    key.includes("subtitle") ||
    key.includes("story") ||
    key.includes("philosophy") ||
    key.includes("commitment") ||
    key.includes("intro");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          Website Content
        </h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {/* Language toggle */}
      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-4 w-4" style={{ color: "var(--admin-muted)" }} />
        {["en", "es"].map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium uppercase transition-colors cursor-pointer ${
              locale === l ? "bg-[#6B4E3D] text-white" : ""
            }`}
            style={
              locale === l
                ? undefined
                : { backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-text)" }
            }
            onMouseEnter={(e) => {
              if (locale !== l) e.currentTarget.style.backgroundColor = "var(--admin-filter-hover)";
            }}
            onMouseLeave={(e) => {
              if (locale !== l) e.currentTarget.style.backgroundColor = "var(--admin-filter-bg)";
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.key}
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
          >
            <button
              onClick={() =>
                setOpenSection(openSection === section.key ? "" : section.key)
              }
              className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--admin-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <h2 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
                {section.label}
              </h2>
              <span className="text-sm" style={{ color: "var(--admin-muted)" }}>
                {section.keys.length} fields
              </span>
            </button>

            {openSection === section.key && (
              <div className="px-6 pb-6 space-y-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
                <div className="pt-4" />
                {section.keys.map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--admin-text)" }}>
                      {keyToLabel(key)}
                    </label>
                    {isLong(key) ? (
                      <textarea
                        value={values[key] ?? ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [key]: e.target.value }))
                        }
                        rows={3}
                        style={contentInputStyle}
                      />
                    ) : (
                      <input
                        type="text"
                        value={values[key] ?? ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [key]: e.target.value }))
                        }
                        style={contentInputStyle}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
