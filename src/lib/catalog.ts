/**
 * La carta de servicios: lo que se ve en /services y lo que se reserva en /book.
 *
 * Una sola lista para las dos páginas, porque ella lo pidió así: "los mismos
 * servicios y precios en la página de servicios y en el sistema de reservas".
 * Antes los precios vivían en los mensajes y la reserva sólo conocía las
 * categorías, así que un balayage apartaba una hora.
 *
 * Sin Prisma a propósito: lo importan componentes de cliente.
 *
 * `durationMinutes: null` = no se reserva en línea (la clienta llama o escribe).
 * Las marcadas "estimado" se pusieron para que ella viera todo reservable desde
 * ya, en vez de esperar su respuesta; se le preguntó cuánto dura cada una.
 */

export type Locale = "es" | "en";
type Text = Record<Locale, string>;

export type CategorySlug = "hair" | "lashes" | "brows" | "facial" | "special";

export type Price = {
  /** Lo mínimo que cuesta. */
  min: number;
  /** Rango: "$65 – $75". */
  max?: number;
  /** "Desde $350": el precio final se define en la cita. */
  from?: boolean;
};

export type CatalogItem = {
  /** Clave estable. Viaja en la URL de disponibilidad y en el formulario. */
  id: string;
  category: CategorySlug;
  /** Subtítulo dentro de la categoría (sólo cabello los usa). */
  group?: string;
  name: Text;
  description?: Text;
  price: Price | null;
  durationMinutes: number | null;
};

export type CatalogGroup = { id: string; title: Text; note?: Text };

export type CatalogCategory = {
  slug: CategorySlug;
  title: Text;
  /** Subtítulo de la categoría, p. ej. "Diseño y cuidado de cejas". */
  subtitle?: Text;
  groups?: CatalogGroup[];
};

export const CATEGORIES: CatalogCategory[] = [
  {
    slug: "hair",
    title: { es: "Cabello", en: "Hair" },
    groups: [
      {
        id: "color",
        title: { es: "Color", en: "Color" },
        note: {
          es: "Incluye peinado liso o en ondas. El tiempo de procesamiento es de 5 a 6 horas.\n\nAntes de iniciar se hace una prueba de mechón para conocer la salud de tu cabello y saber si podemos continuar con el proceso.",
          en: "Includes a sleek or wavy finish. Processing time is 5 to 6 hours.\n\nBefore we begin, we do a strand test to check the health of your hair and make sure we can go ahead with the process.",
        },
      },
      { id: "cut", title: { es: "Corte", en: "Haircut" } },
      { id: "treatment", title: { es: "Tratamiento nutritivo", en: "Nourishing treatment" } },
      { id: "blowout", title: { es: "Blowout", en: "Blowout" } },
    ],
  },
  { slug: "lashes", title: { es: "Pestañas", en: "Lashes" } },
  {
    slug: "brows",
    title: { es: "Cejas", en: "Brows" },
    subtitle: { es: "Diseño y cuidado de cejas", en: "Brow design and care" },
  },
  { slug: "facial", title: { es: "Tratamientos Faciales", en: "Facial Treatments" } },
  { slug: "special", title: { es: "Servicios Especiales", en: "Special Services" } },
];

export const CATALOG: CatalogItem[] = [
  // ── Cabello ──
  {
    id: "hair-balayage",
    category: "hair",
    group: "color",
    name: { es: "Balayage, highlights", en: "Balayage, highlights" },
    price: { min: 350, from: true },
    // Ella dijo 5 a 6 horas; se aparta el máximo para no quedarse corta.
    durationMinutes: 360,
  },
  {
    id: "hair-ends-refresh",
    category: "hair",
    group: "cut",
    name: { es: "Despunte", en: "Ends refresh" },
    price: { min: 35 },
    durationMinutes: 30, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-womens-cut",
    category: "hair",
    group: "cut",
    name: { es: "Corte de dama", en: "Women's cut" },
    price: { min: 65 },
    durationMinutes: 60, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-mens-cut",
    category: "hair",
    group: "cut",
    name: { es: "Corte de caballero", en: "Men's cut" },
    price: { min: 40 },
    durationMinutes: 30, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-treatment",
    category: "hair",
    group: "treatment",
    name: { es: "Tratamiento nutritivo", en: "Nourishing hair treatment" },
    price: { min: 45 },
    durationMinutes: 45, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-treatment-blowout-short",
    category: "hair",
    group: "treatment",
    name: { es: "Tratamiento con blowout, cabello corto", en: "Treatment with blowout, short hair" },
    price: { min: 65 },
    durationMinutes: 75, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-treatment-blowout-long",
    category: "hair",
    group: "treatment",
    name: { es: "Tratamiento con blowout, cabello largo", en: "Treatment with blowout, long hair" },
    price: { min: 75 },
    durationMinutes: 90, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-blowout-short",
    category: "hair",
    group: "blowout",
    name: { es: "Blowout, cabello corto", en: "Blowout, short hair" },
    description: {
      es: "Cabello hasta aproximadamente los hombros.",
      en: "Hair up to about shoulder length.",
    },
    price: { min: 45 },
    durationMinutes: 45, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-blowout-long",
    category: "hair",
    group: "blowout",
    name: { es: "Blowout, cabello largo", en: "Blowout, long hair" },
    description: { es: "Cabello debajo de los hombros.", en: "Hair below the shoulders." },
    price: { min: 55 },
    durationMinutes: 60, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "hair-blowout-thick",
    category: "hair",
    group: "blowout",
    name: { es: "Blowout, cabello largo o grueso", en: "Blowout, long or thick hair" },
    description: {
      es: "Para cabello que por su largo, densidad o textura requiere más tiempo de secado y estilizado.",
      en: "For hair that, because of its length, density or texture, needs more drying and styling time.",
    },
    price: { min: 65, max: 75 },
    durationMinutes: 90, // estimado: se le preguntó, se corrige cuando conteste
  },

  // ── Pestañas ── (los nombres Wispy y Anime se quedan igual en los dos idiomas)
  {
    id: "lash-lift",
    category: "lashes",
    name: { es: "Lifting de Pestañas", en: "Lash Lift" },
    description: {
      es: "Tratamiento que eleva y curva tus pestañas naturales para realzar tu mirada sin necesidad de extensiones, con un acabado elegante y natural.",
      en: "A treatment that lifts and curls your natural lashes to enhance your look without extensions, with an elegant, natural finish.",
    },
    price: { min: 85 },
    durationMinutes: 60, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "lash-lift-tint",
    category: "lashes",
    name: { es: "Lifting y Tinte de Pestañas", en: "Lash Lift & Tint" },
    description: {
      es: "Tratamiento que eleva, curva y define tus pestañas naturales sin necesidad de extensiones. Incluye tinte para aportar mayor intensidad y un acabado elegante y natural.",
      en: "A treatment that lifts, curls and defines your natural lashes without extensions. Includes a tint for extra intensity and an elegant, natural finish.",
    },
    price: { min: 95 },
    durationMinutes: 75, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "lash-classic",
    category: "lashes",
    name: { es: "Set Clásico", en: "Classic Set" },
    description: {
      es: "Extensiones pelo a pelo para un resultado natural, delicado y elegante. Perfectas para realzar tu mirada sin perder naturalidad.",
      en: "One-to-one extensions for a natural, delicate and elegant result. Perfect for enhancing your eyes while keeping them natural.",
    },
    price: { min: 100 },
    durationMinutes: 120, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "lash-hybrid",
    category: "lashes",
    name: { es: "Set Híbrido", en: "Hybrid Set" },
    description: {
      es: "Combinación de técnica clásica y volumen para conseguir una mirada con mayor textura, definición y densidad.",
      en: "A blend of classic and volume techniques for a look with more texture, definition and density.",
    },
    price: { min: 115 },
    durationMinutes: 150, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "lash-wispy",
    category: "lashes",
    name: { es: "Set Wispy", en: "Wispy Set" },
    description: {
      es: "Extensiones de diferentes longitudes que crean un efecto ligero, texturizado y sofisticado. Ideales para una mirada definida, con un acabado delicado y moderno.",
      en: "Extensions in different lengths that create a light, textured and sophisticated effect. Ideal for defined eyes with a delicate, modern finish.",
    },
    price: { min: 120 },
    durationMinutes: 150, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "lash-anime",
    category: "lashes",
    name: { es: "Set Anime", en: "Anime Set" },
    description: {
      es: "Inspirado en las pestañas estilo manga, combina picos largos y definidos con espacios estratégicos para crear una mirada de muñeca, expresiva y llamativa.",
      en: "Inspired by manga-style lashes, it combines long, defined spikes with strategic spacing to create an expressive, eye-catching doll-eye look.",
    },
    price: { min: 120 },
    durationMinutes: 150, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "lash-volume",
    category: "lashes",
    name: { es: "Set Volumen", en: "Volume Set" },
    description: {
      es: "Extensiones que aportan mayor densidad e intensidad para una mirada definida, glamurosa y más dramática.",
      en: "Extensions that add density and intensity for a defined, glamorous and more dramatic look.",
    },
    price: { min: 120 },
    durationMinutes: 180, // estimado: se le preguntó, se corrige cuando conteste
  },

  // ── Cejas ──
  {
    id: "brow-lamination",
    category: "brows",
    name: { es: "Laminado de Cejas", en: "Brow Lamination" },
    description: {
      es: "Tratamiento que alinea y estiliza los vellos de las cejas para lograr un efecto más definido, uniforme y voluminoso, conservando un acabado natural.",
      en: "A treatment that aligns and styles the brow hairs for a more defined, even and fuller effect, while keeping a natural finish.",
    },
    price: { min: 85 },
    durationMinutes: 60, // estimado: se le preguntó, se corrige cuando conteste
  },
  {
    id: "brow-wax",
    category: "brows",
    name: { es: "Depilación de Cejas con Cera", en: "Brow Wax" },
    description: {
      es: "Depilación con cera que elimina el vello no deseado, definiendo y limpiando el contorno de las cejas. Respeta su forma natural para lograr un acabado limpio y cuidado.",
      en: "Waxing that removes unwanted hair, defining and cleaning up the brow outline. It respects their natural shape for a clean, polished finish.",
    },
    price: { min: 25 },
    durationMinutes: 30, // estimado: se le preguntó, se corrige cuando conteste
  },

  // ── Faciales y especiales: los mismos de antes, con sus precios ──
  {
    id: "facial-signature",
    category: "facial",
    name: { es: "Facial Signature", en: "Signature Facial" },
    description: {
      es: "Un facial personalizado que incluye limpieza, exfoliación, mascarilla e hidratación.",
      en: "A customized facial including cleansing, exfoliation, mask, and hydration.",
    },
    price: { min: 70 },
    durationMinutes: 60,
  },
  {
    id: "facial-glow",
    category: "facial",
    name: { es: "Tratamiento Glow Hidratante", en: "Hydrating Glow Treatment" },
    description: {
      es: "Hidratación intensiva para piel seca o apagada.",
      en: "Intensive hydration for dry or dull skin.",
    },
    price: { min: 55 },
    durationMinutes: 45,
  },
  {
    id: "special-bridal",
    category: "special",
    name: { es: "Paquete de Belleza Nupcial", en: "Bridal Beauty Package" },
    description: {
      es: "Preparación de belleza completa para tu día especial — cabello, pestañas y maquillaje.",
      en: "Complete beauty preparation for your special day — hair, lashes, and makeup.",
    },
    price: { min: 250, from: true },
    // A la medida: se arma hablando con ella, no en el calendario.
    durationMinutes: null,
  },
  {
    id: "special-event-glam",
    category: "special",
    name: { es: "Sesión Glam para Eventos", en: "Event Glam Session" },
    description: {
      es: "Estilismo completo para fiestas, sesiones de fotos u ocasiones especiales.",
      en: "Full styling for parties, photoshoots, or special occasions.",
    },
    price: { min: 120, from: true },
    // "2 a 3 horas": se aparta el máximo.
    durationMinutes: 180,
  },
];

export function findItem(id: string): CatalogItem | undefined {
  return CATALOG.find((i) => i.id === id);
}

export function itemsOf(category: CategorySlug): CatalogItem[] {
  return CATALOG.filter((i) => i.category === category);
}

export function isBookable(item: CatalogItem): boolean {
  return item.durationMinutes != null && item.durationMinutes > 0;
}

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** "$85", "$65 – $75", "Desde $350" / "From $350". */
export function priceLabel(price: Price | null, locale: Locale): string {
  if (!price) return "";
  if (price.max != null) return `${money(price.min)} – ${money(price.max)}`;
  if (price.from) return `${locale === "es" ? "Desde" : "From"} ${money(price.min)}`;
  return money(price.min);
}

/** Lo que queda por pagar el día de la cita, con el mismo formato que el precio. */
export function balanceLabel(price: Price | null, deposit: number, locale: Locale): string {
  if (!price) return "";
  const rest = (n: number) => Math.max(0, n - deposit);
  return priceLabel(
    { min: rest(price.min), max: price.max != null ? rest(price.max) : undefined, from: price.from },
    locale,
  );
}

/** El precio que se guarda en la cita. Sólo si es fijo: un rango o un "desde" lo pone ella. */
export function fixedPrice(price: Price | null): number | null {
  if (!price || price.from || price.max != null) return null;
  return price.min;
}

/** Cómo queda escrito en la cita y en el panel (en español, que es el idioma del panel). */
export function appointmentLabel(item: CatalogItem): string {
  const cat = CATEGORIES.find((c) => c.slug === item.category)!;
  return `${cat.title.es} · ${item.name.es}`;
}
