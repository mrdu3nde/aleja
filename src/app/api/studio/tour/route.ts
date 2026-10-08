import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentDevice } from "@/lib/device";

const schema = z.object({ totalSteps: z.number().int().min(1).max(100) });

/** Empieza un recorrido del tour; devuelve su id para ir anotando el avance. */
export async function POST(request: Request) {
  try {
    const { totalSteps } = schema.parse(await request.json());
    const run = await prisma.tourRun.create({ data: { totalSteps, device: await currentDevice() } });
    return NextResponse.json({ id: run.id }, { status: 201 });
  } catch (error) {
    console.error("Tour start error:", error);
    return NextResponse.json({ error: "Failed to start" }, { status: 400 });
  }
}
