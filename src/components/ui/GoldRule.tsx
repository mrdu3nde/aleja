/**
 * Una línea corta en dorado champagne bajo los títulos.
 *
 * Ella pidió el dorado "muy poco, solo toques": esto es uno de esos toques.
 * Es decorativa, así que los lectores de pantalla la ignoran.
 */
export function GoldRule({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`block h-px w-16 bg-gold/70 ${className}`} />;
}
