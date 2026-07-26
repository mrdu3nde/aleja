import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Confirmations the owner has not opened yet — drives the badge in the studio. */
export async function GET() {
  try {
    const count = await prisma.appointment.count({
      where: { clientConfirmedAt: { not: null }, confirmationSeen: false },
    });
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Confirmations count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
