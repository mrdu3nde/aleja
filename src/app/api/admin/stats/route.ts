import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalClients, activeAppointments, newLeads, recentAppointments, recentLeads] =
      await Promise.all([
        prisma.client.count(),
        prisma.appointment.count({
          where: { status: { in: ["pending", "confirmed"] } },
        }),
        prisma.lead.count({ where: { status: "new" } }),
        prisma.appointment.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.lead.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      totalClients,
      activeAppointments,
      newLeads,
      recentAppointments,
      recentLeads,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
