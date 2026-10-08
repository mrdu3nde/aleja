import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Subida de fotos SOLO para desarrollo, cuando Vercel Blob no está conectado.
 *
 * Guarda el archivo en `public/uploads/` (fuera de git) para poder probar la
 * galería y las fichas en localhost. En producción no existe: responde 404.
 */
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !TYPES[file.type]) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const name = `${randomUUID()}.${TYPES[file.type]}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${name}` });
}
