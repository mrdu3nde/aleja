import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClientWelcome } from "@/lib/email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id } });

    // Check if client already exists with this email
    let client = await prisma.client.findUnique({
      where: { email: lead.email },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone || null,
        },
      });
    }

    // Update lead status
    await prisma.lead.update({
      where: { id },
      data: { status: "converted", convertedClientId: client.id },
    });

    // Link any existing appointments by email
    await prisma.appointment.updateMany({
      where: { clientEmail: lead.email, clientId: null },
      data: { clientId: client.id },
    });

    // Send welcome email
    sendClientWelcome({ name: client.name, email: client.email }).catch(console.error);

    return NextResponse.json({ success: true, clientId: client.id });
  } catch (error) {
    console.error("Convert lead error:", error);
    return NextResponse.json({ error: "Failed to convert" }, { status: 500 });
  }
}
