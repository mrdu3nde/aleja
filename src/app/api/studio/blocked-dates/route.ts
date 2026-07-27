import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { date, reason } = await request.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const row = await prisma.blockedDate.upsert({
      where: { date },
      update: { reason: reason || null },
      create: { date, reason: reason || null },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Block date error:", error);
    return NextResponse.json({ error: "Failed to block" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { date } = await request.json();
    if (date) await prisma.blockedDate.deleteMany({ where: { date } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unblock date error:", error);
    return NextResponse.json({ error: "Failed to unblock" }, { status: 500 });
  }
}
