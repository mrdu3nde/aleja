import fs from "node:fs";
import path from "node:path";

/**
 * El logo de ALUH como archivo, si existe.
 *
 * Se resuelve en el servidor porque hay que mirar el disco: si pintáramos una
 * ruta que no existe, la página mostraría el icono de imagen rota, que se ve
 * peor que no poner nada.
 *
 * Mientras no haya archivo, el sitio dibuja el logotipo tipográfico en dorado
 * (ver `BrandFrame`), así que la página nunca queda con un hueco.
 *
 * Dos caminos, en este orden:
 *   1. `brand.logo_image` en la tabla Content — una URL, para cuando Vercel
 *      Blob esté conectado y se pueda subir desde el panel.
 *   2. Un archivo en `public/images/`. Hoy es la vía que funciona: basta con
 *      dejar ahí `logo.svg` (o .png / .webp / .jpg) y recargar.
 */

// El SVG va primero: un logo vectorial se ve nítido a cualquier tamaño.
const NAMES = ["logo.svg", "logo.png", "logo.webp", "logo.jpg", "logo.jpeg"];

export function brandImage(content: Record<string, string>): string | null {
  const fromContent = content["brand.logo_image"]?.trim();
  if (fromContent) return fromContent;

  for (const name of NAMES) {
    if (fs.existsSync(path.join(process.cwd(), "public", "images", name))) {
      return `/images/${name}`;
    }
  }

  return null;
}
