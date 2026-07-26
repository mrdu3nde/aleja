import { NextResponse } from "next/server";
import { z } from "zod";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  price: z.number().min(0).max(100000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = updateSchema.parse(await request.json());
    const current = await prisma.service.findUniqueOrThrow({ where: { id } });

    // Replacing or clearing the photo should not leave the old file behind.
    if (
      data.imageUrl !== undefined &&
      current.imageUrl &&
      current.imageUrl !== data.imageUrl
    ) {
      del(current.imageUrl).catch((err) =>
        console.error("Could not delete replaced blob:", err),
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const service = await prisma.service.findUniqueOrThrow({ where: { id } });

    // Past appointments keep the service name as plain text, so removing the
    // service never rewrites history.
    if (service.imageUrl) {
      del(service.imageUrl).catch((err) =>
        console.error("Could not delete blob:", err),
      );
    }

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
