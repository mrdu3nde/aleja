import fs from "node:fs/promises";
import path from "node:path";
import { del } from "@vercel/blob";

/**
 * Lado servidor de `upload-image.ts`: las fotos de Blob se borran en Blob y las
 * de desarrollo (`/uploads/...`) del disco.
 */

/** Borra una foto que ya no se usa. Nunca hace fallar a quien la llama. */
export async function deleteImage(url: string | null | undefined) {
  if (!url) return;
  try {
    if (url.startsWith("/uploads/")) {
      // Sólo el nombre del archivo: una URL guardada nunca puede apuntar fuera
      // de la carpeta de subidas.
      await fs.unlink(path.join(process.cwd(), "public", "uploads", path.basename(url)));
    } else {
      await del(url);
    }
  } catch (err) {
    console.error("No se pudo borrar la foto:", err);
  }
}
