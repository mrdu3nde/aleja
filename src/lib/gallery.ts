import { prisma } from "./prisma";

export type GalleryPhoto = { id: string; url: string; alt: string | null };

/**
 * Las fotos de la galería pública, en el orden que ella eligió.
 * Si la base falla devuelve una lista vacía: la galería se ve vacía, no rota.
 */
export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    return await prisma.galleryPhoto.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, url: true, alt: true },
    });
  } catch {
    return [];
  }
}
