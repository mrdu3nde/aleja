import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get("locale") ?? "en";
    const rows = await prisma.content.findMany({ where: { locale } });
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return NextResponse.json(map);
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { locale, entries } = (await request.json()) as {
      locale: string;
      entries: Record<string, string>;
    };

    const ops = Object.entries(entries).map(([key, value]) =>
      prisma.content.upsert({
        where: { key_locale: { key, locale } },
        update: { value },
        create: { key, locale, value },
      }),
    );

    await prisma.$transaction(ops);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content PUT error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
