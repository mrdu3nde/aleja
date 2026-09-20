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
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl md:text-4xl",
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
