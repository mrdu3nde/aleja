import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { sendLeadWelcome, sendLeadAdminNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        source: data.source || "contact_form",
        locale: data.locale || null,
        status: "new",
      },
    });

    Promise.allSettled([
      sendLeadWelcome({ name: data.name, email: data.email }),
      sendLeadAdminNotification({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      }),
    ]).catch(console.error);

    return NextResponse.json({ success: true, id: lead.id });
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
