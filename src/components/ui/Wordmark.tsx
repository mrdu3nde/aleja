/**
 * El logo de ALUH.
 *
 * Es un logotipo tipográfico, no una imagen: se dibuja con la fuente de
 * titulares, así que escala perfecto en cualquier pantalla, pesa cero y el
 * dorado se puede ajustar desde una variable en vez de reexportar un archivo.
 *
 * El nombre va en versalitas con letra espaciada porque "ALUH" son cuatro
 * letras: sin ese aire se lee como una palabra apretada, no como una marca.
 */

type Props = {
  /** El pie es café oscuro y necesita el oro claro para tener contraste. */
  onDark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

// Ella pidió el logo más grande: el de la cabecera ("md") era de 20 px y se
// perdía. "xl" es para el inicio, donde el logo ocupa el lugar de la foto.
const sizes = {
  sm: "text-xl",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
  xl: "text-7xl sm:text-8xl lg:text-9xl",
};

export function Wordmark({ onDark = false, size = "md", className = "" }: Props) {
  return (
    <span
      className={`font-[family-name:var(--font-heading)] font-bold tracking-[0.18em] ${
        sizes[size]
      } ${onDark ? "wordmark-gold-on-dark" : "wordmark-gold"} ${className}`}
    >
      ALUH
    </span>
  );
}
