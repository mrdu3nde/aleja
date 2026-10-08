import { upload } from "@vercel/blob/client";

/** Blob no está conectado y no hay alternativa (producción sin token). */
export class UploadNotConfiguredError extends Error {}

/**
 * Sube una foto desde el panel y devuelve su URL.
 *
 * En Vercel la foto va directo del teléfono a Blob (no pasa por la función, así
 * que no le afecta el límite de tamaño). En desarrollo sin Blob se guarda en
 * `public/uploads/`, para poder probar todo en localhost.
 */
export async function uploadImage(pathname: string, file: File): Promise<string> {
  const support = (await fetch("/api/studio/upload").then((r) => r.json())) as {
    blob: boolean;
    local: boolean;
  };

  if (support.blob) {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/studio/upload",
    });
    return blob.url;
  }

  if (!support.local) throw new UploadNotConfiguredError();

  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/studio/upload/local", { method: "POST", body: form });
  if (!res.ok) throw new Error(`upload_failed_${res.status}`);
  return ((await res.json()) as { url: string }).url;
}
