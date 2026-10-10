"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Globe } from "lucide-react";
import { ServicesEditor, type Service } from "@/components/admin/ServicesEditor";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

type SectionDef = { key: string; label: string; keys: string[] };

const sections: SectionDef[] = [
  {
    key: "hero",
    label: "Portada",
    keys: ["hero.headline", "hero.subheadline"],
  },
  {
    key: "trust",
    label: "The ALUH Experience",
    keys: [
      "trust.title",
      "trust.subtitle",
      "trust.personalized",
      "trust.personalized_desc",
      "trust.refined",
      "trust.refined_desc",
      "trust.intentional",
      "trust.intentional_desc",
    ],
  },
  {
    key: "services",
    label: "Servicios",
    keys: [
      "services_section.hair.title",
      "services_section.hair.description",
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
    label: "Nosotros",
    keys: [
      "about_preview.title",
      "about_preview.text",
      "about_page.title",
      "about_page.tagline",
      "about_page.philosophy",
      "about_page.story",
      "about_page.experience",
    ],
  },
  {
    key: "booking",
    label: "Booking CTA",
    keys: ["booking_cta.title", "booking_cta.subtitle"],
  },
];

/**
 * El panel está en español, pero las claves están en inglés y `keyToLabel` las
 * derivaba tal cual ("Tagline", "Story"). Aquí van las que se ven raro; el
 * resto sigue derivándose solo.
 */
const LABELS: Record<string, string> = {
  "about_preview.title": "Título en la portada",
  "about_preview.text": "Texto en la portada",
  "about_page.title": "Nombre de la sección",
  "about_page.tagline": "Frase principal",
  "about_page.philosophy": "Mi filosofía",
  "about_page.story": "Mi historia",
  "about_page.experience": "La experiencia ALUH",
  "hero.headline": "Titular",
  "hero.subheadline": "Subtítulo",
  "booking_cta.title": "Título",
  "booking_cta.subtitle": "Subtítulo",
};

function keyToLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const parts = key.split(".");
  const last = parts[parts.length - 1];
  return last
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Lo que se ve cuando no hay nada guardado: los mismos textos del sitio. Se
// leen de los archivos de mensajes para que nunca se desfasen de lo publicado.
function fromMessages(messages: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of sections.flatMap((s) => s.keys)) {
    const value = key
      .split(".")
      .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

const defaults: Record<string, Record<string, string>> = {
  en: fromMessages(en),
  es: fromMessages(es),
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
  const [openSection, setOpenSection] = useState<string>("services");
  const [services, setServices] = useState<Service[]>([]);
  const [servicesKey, setServicesKey] = useState(0);

  useEffect(() => {
    fetch(`/api/studio/content?locale=${locale}`)
      .then((r) => r.json())
      .then((dbValues: Record<string, string>) => {
        // keep prices out of the translated bucket, or saving Spanish would
        // fork them into a second set of numbers
        const text = Object.fromEntries(
          Object.entries(dbValues).filter(([k]) => !k.startsWith("service_price.")),
        );
        setValues({ ...defaults[locale], ...text });
      })
      .catch(console.error);
  }, [locale]);

  useEffect(() => {
    fetch("/api/studio/services")
      .then((r) => r.json())
      .then((res) => setServices(res.data ?? []))
      .catch(console.error);
  }, [servicesKey]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    // Prices and photos save themselves as they are edited; this only writes
    // the translated copy.
    await fetch("/api/studio/content", {
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
    key.includes("experience");

  /** Su historia son cuatro párrafos: en tres líneas no se puede releer. */
  const rowsFor = (key: string) =>
    key.includes("story") ? 12 : key.includes("experience") ? 7 : 3;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
          Contenido del sitio
        </h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" /> Guardado
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#6B4E3D] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar todo"}
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
                {section.key === "services" ? `${services.length} servicios` : `${section.keys.length} campos`}
              </span>
            </button>

            {openSection === section.key && (
              <div className="px-6 pb-6 space-y-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
                <div className="pt-4" />

                {/* Each service keeps its title, description and price together —
                    they describe the same thing, so they are edited together. */}
                {section.key === "services" ? (
                  <ServicesEditor
                    services={services}
                    values={values}
                    onValueChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
                    onReload={() => setServicesKey((k) => k + 1)}
                    inputStyle={contentInputStyle}
                  />
                ) : null}

                {section.keys
                  .filter(
                    (key) =>
                      // the per-service fields are rendered in their own group above
                      section.key !== "services" || !/^services_section\.[a-z]+\./.test(key),
                  )
                  .map((key) => (
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
                        rows={rowsFor(key)}
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
