import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validators";
import { sendToN8N } from "@/lib/n8n";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);

    await Promise.allSettled([
      sendToN8N(process.env.N8N_LEAD_WEBHOOK_URL ?? "", {
        ...data,
        timestamp: new Date().toISOString(),
        type: "lead",
      }),
      prisma.lead.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          message: data.message,
          source: data.source || "contact_form",
          locale: data.locale || null,
          status: "new",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 },
      );
    }
    console.error("Lead API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
