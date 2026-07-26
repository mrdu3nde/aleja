import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeBalance } from "@/lib/balance";

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
      pendingDeposits,
      completedThisMonth,
      allAppointments,
      recentAppointments,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.appointment.count({
        where: { status: { in: ["pending", "confirmed"] } },
      }),
      prisma.appointment.count({
        where: {
          depositRequired: true,
          depositStatus: "pending",
          status: { not: "cancelled" },
        },
      }),
      prisma.appointment.count({
        where: { status: "completed", updatedAt: { gte: startOfMonth } },
      }),
      prisma.appointment.findMany({
        select: { status: true, createdAt: true, preferredDate: true },
      }),
      prisma.appointment.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    // ── Money ──────────────────────────────────────────────────────────────
    // Two sources: deposits (dated by depositReceivedAt) and later payments
    // (dated by createdAt). Only money actually in hand is counted — a deposit
    // that has not been marked as received is a promise, not income.
    const [priced, payments] = await Promise.all([
      prisma.appointment.findMany({
        // a cancelled booking is not an outstanding balance
        where: { servicePrice: { not: null }, status: { not: "cancelled" } },
        select: {
          servicePrice: true,
          depositRequired: true,
          depositAmount: true,
          depositStatus: true,
          depositReceivedAt: true,
          payments: { select: { amount: true, createdAt: true } },
        },
      }),
      prisma.payment.findMany({ select: { amount: true, createdAt: true } }),
    ]);

    const depositsReceived = await prisma.appointment.findMany({
      where: { depositRequired: true, depositStatus: "received" },
      select: { depositAmount: true, depositReceivedAt: true },
    });

    const sumSince = (
      rows: Array<{ amount?: unknown; depositAmount?: unknown; createdAt?: Date; depositReceivedAt?: Date | null }>,
      since: Date | null,
      dateKey: "createdAt" | "depositReceivedAt",
      amountKey: "amount" | "depositAmount",
    ) =>
      rows.reduce((total, row) => {
        const when = row[dateKey] as Date | null | undefined;
        if (since && (!when || when < since)) return total;
        return total + Number(row[amountKey] ?? 0);
      }, 0);

    const collected = (since: Date | null) =>
      sumSince(payments, since, "createdAt", "amount") +
      sumSince(depositsReceived, since, "depositReceivedAt", "depositAmount");

    // What clients still owe, across every priced appointment.
    const outstanding = priced.reduce(
      (total, apt) => total + computeBalance(apt).remaining,
      0,
    );

    const round = (n: number) => Math.round(n * 100) / 100;

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

    // Recent activity
    const activity = recentAppointments.map((a: Record<string, unknown>) => ({
      id: a.id,
      type: "appointment" as const,
      title: a.clientName as string,
      subtitle: a.service as string,
      status: a.status as string,
      date: a.createdAt,
    }));

    return NextResponse.json({
      totalClients,
      activeAppointments,
      pendingDeposits,
      completedThisMonth,
      money: {
        week: round(collected(startOfWeek)),
        month: round(collected(startOfMonth)),
        allTime: round(collected(null)),
        outstanding: round(outstanding),
      },
      statusDistribution: statusCounts,
      weeklyAppointments: weeklyData,
      recentActivity: activity,
      recentAppointments,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
