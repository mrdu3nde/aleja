import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  // Una URL de Blob, o `/uploads/...` en desarrollo.
  url: z.string().min(1).max(1000).refine((u) => u.startsWith("https://") || u.startsWith("/uploads/")),
  alt: z.string().max(200).nullable().optional(),
});

const orderSchema = z.object({ ids: z.array(z.string().uuid()).max(200) });

export async function GET() {
  try {
    const data = await prisma.galleryPhoto.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Gallery list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = createSchema.parse(await request.json());
    // Las nuevas van al final; ella las reordena después si quiere.
    const last = await prisma.galleryPhoto.findFirst({ orderBy: { sortOrder: "desc" } });
    const photo = await prisma.galleryPhoto.create({
      data: { url: data.url, alt: data.alt ?? null, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Gallery create error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 400 });
  }
}

/** Nuevo orden completo: la posición en `ids` es el `sortOrder`. */
export async function PUT(request: Request) {
  try {
    const { ids } = orderSchema.parse(await request.json());
    await prisma.$transaction(
      ids.map((id, i) => prisma.galleryPhoto.update({ where: { id }, data: { sortOrder: i } })),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gallery order error:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 400 });
  }
}
