import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentDevice } from "@/lib/device";

const schema = z.object({
  releaseId: z.string().min(1).max(80),
  event: z.enum(["visto", "entendido", "historial"]),
});

/** Todo lo registrado: qué se vio, cuándo, en qué dispositivo, y los tours. */
export async function GET() {
  try {
    const [views, tours] = await Promise.all([
      prisma.updateView.findMany({ orderBy: { createdAt: "asc" }, take: 500 }),
      prisma.tourRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
    ]);
    return NextResponse.json({ views, tours });
  } catch (error) {
    console.error("Novedades list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = schema.parse(await request.json());
    await prisma.updateView.create({ data: { ...data, device: await currentDevice() } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Novedades record error:", error);
    return NextResponse.json({ error: "Failed to record" }, { status: 400 });
  }
}
