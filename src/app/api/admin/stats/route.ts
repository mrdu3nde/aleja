import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalClients,
      activeAppointments,
      newLeads,
      completedThisMonth,
      allAppointments,
      recentAppointments,
      recentLeads,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.appointment.count({
        where: { status: { in: ["pending", "confirmed"] } },
      }),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.appointment.count({
        where: { status: "completed", updatedAt: { gte: startOfMonth } },
      }),
      prisma.appointment.findMany({
        select: { status: true, createdAt: true, preferredDate: true },
      }),
      prisma.appointment.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Status distribution for donut chart
    const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const apt of allAppointments) {
      if (apt.status in statusCounts) {
        statusCounts[apt.status as keyof typeof statusCounts]++;
      }
    }

    // Appointments per day (last 7 days) for bar chart
    const weeklyData: Array<{ day: string; count: number }> = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = allAppointments.filter((a) => {
        const created = new Date(a.createdAt);
        return created >= d && created < next;
      }).length;
      weeklyData.push({ day: dayNames[d.getDay()], count });
    }

    // Combined recent activity (appointments + leads merged and sorted)
    const activity = [
      ...recentAppointments.map((a: Record<string, unknown>) => ({
        id: a.id,
        type: "appointment" as const,
        title: a.clientName as string,
        subtitle: a.service as string,
        status: a.status as string,
        date: a.createdAt,
      })),
      ...recentLeads.map((l: Record<string, unknown>) => ({
        id: l.id,
        type: "lead" as const,
        title: l.name as string,
        subtitle: ((l.message as string) || "").slice(0, 60),
        status: l.status as string,
        date: l.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
      .slice(0, 8);

    return NextResponse.json({
      totalClients,
      activeAppointments,
      newLeads,
      completedThisMonth,
      statusDistribution: statusCounts,
      weeklyAppointments: weeklyData,
      recentActivity: activity,
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
