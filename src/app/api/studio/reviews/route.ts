import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Todas las reseñas, las nuevas primero. Protegido por la sesión del panel (proxy.ts). */
export async function GET() {
  try {
    const data = await prisma.review.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Reviews list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
