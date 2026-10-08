"use client";

import Image from "next/image";
import { Wordmark } from "./Wordmark";

/**
 * El panel de marca que ocupa el lugar donde antes iba una fotografía.
 *
 * Si existe el archivo del logo, se muestra centrado y **sin recortar**: un
 * logo no se encuadra como un retrato, se respeta entero y se le deja aire
 * alrededor. Si no existe, se dibuja el logotipo tipográfico en dorado, que es
 * el mismo de la cabecera — así la página nunca se ve incompleta.
 *
 * El fondo es un degradado suave de la paleta, no un bloque plano: le da
 * cuerpo al panel para que no parezca un hueco vacío junto al texto.
 */

type Props = {
  src: string | null;
  alt: string;
  ratio?: "portrait" | "square";
  priority?: boolean;
  className?: string;
};

export function BrandFrame({
  src,
  alt,
  ratio = "portrait",
  priority = false,
  className = "",
}: Props) {
  const aspect = ratio === "portrait" ? "aspect-[4/5]" : "aspect-square";

  return (
    <div
      className={`${aspect} rounded-2xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-champagne-light via-warm-white to-champagne ${className}`}
    >
      {/* Un filo dorado muy tenue: marca el borde sin competir con el logo. */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(194, 162, 107, 0.25)" }}
      />

      {src ? (
        <div className="relative w-full h-full p-12 md:p-16">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 768px) 50vw, 100vw"
            // `contain`, no `cover`: recortar un logo sería mutilarlo.
            className="object-contain"
          />
        </div>
      ) : (
        <Wordmark size="lg" className="text-4xl md:text-5xl" />
      )}
    </div>
  );
}
