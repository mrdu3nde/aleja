import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  /** El paso que está viendo (1 = el primero). */
  step: z.number().int().min(1).max(100),
  finished: z.boolean().optional(),
});

/** Anota hasta dónde llegó. Nunca retrocede: volver atrás no borra el avance. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { step, finished } = schema.parse(await request.json());
    const run = await prisma.tourRun.findUniqueOrThrow({ where: { id } });
    await prisma.tourRun.update({
      where: { id },
      data: {
        lastStep: Math.max(run.lastStep, step),
        ...(finished && !run.finishedAt ? { finishedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tour progress error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}
