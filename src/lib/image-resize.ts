/**
 * Reduce una foto en el navegador antes de subirla.
 *
 * Hace tres trabajos a la vez:
 *  - Peso: una foto de celular pesa 3-12 MB y revienta el límite del servidor.
 *  - Formato: el iPhone entrega HEIC, que el endpoint de subida rechaza; al
 *    pasar por un canvas siempre sale JPEG.
 *  - Velocidad: menos píxeles, menos tiempo de lectura del modelo.
 *
 * No se comprime más de la cuenta a propósito: por debajo de ~1600px los
 * trazos finos del esfero se deshacen y el modelo empieza a fallar.
 */
export async function resizeImage(
  file: File,
  maxSide = 1600,
  quality = 0.85,
): Promise<{ dataUrl: string; blob: Blob }> {
  const bitmap = await loadBitmap(file);

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas");
  // Fondo blanco: un PNG con transparencia sobre JPEG saldría negro.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("no_blob"))),
      "image/jpeg",
      quality,
    ),
  );

  return { dataUrl, blob };
}

/** createImageBitmap es lo más rápido, pero no todos los navegadores decodifican
 *  HEIC por esa vía; el <img> con object URL sirve de respaldo. */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
