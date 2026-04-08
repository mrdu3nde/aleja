import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadUpdateSchema } from "@/lib/admin-validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await prisma.lead.findUniqueOrThrow({ where: { id } });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get lead error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = leadUpdateSchema.parse(body);

    const lead = await prisma.lead.update({
      where: { id },
      data: { status: data.status },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Update lead error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
