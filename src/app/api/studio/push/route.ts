import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Register (or refresh) a device so it can receive confirmation notifications. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys, label } = body ?? {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, label: label ?? null },
      update: { p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ id: sub.id });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}

/** How many devices are registered — lets the UI show the real state. */
export async function GET() {
  const count = await prisma.pushSubscription.count();
  return NextResponse.json({ count });
}
