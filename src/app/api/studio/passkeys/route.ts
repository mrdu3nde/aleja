import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Dispositivos registrados. Nunca devuelve la llave pública ni el contador. */
export async function GET() {
  try {
    const credentials = await prisma.credential.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        deviceName: true,
        backedUp: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("passkeys list", error);
    return NextResponse.json({ error: "No se pudieron cargar los dispositivos" }, { status: 500 });
  }
}
