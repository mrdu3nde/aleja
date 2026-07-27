"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  UserPlus,
  CalendarPlus,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WeeklyChart } from "@/components/admin/WeeklyChart";
import { StatusDonut } from "@/components/admin/StatusDonut";

type Stats = {
  totalClients: number;
  activeAppointments: number;
  pendingDeposits: number;
  completedThisMonth: number;
  money: {
    week: number;
    month: number;
    allTime: number;
    outstanding: number;
  };
  statusDistribution: { pending: number; confirmed: number; completed: number; cancelled: number };
  weeklyAppointments: Array<{ day: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: "appointment";
    title: string;
    subtitle: string;
    status: string;
    date: string;
  }>;
};

function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: "var(--admin-border)" }}
    />
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<Record<string, unknown>>;
  color: string;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        borderRadius: 16,
        padding: "20px 24px",
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = "var(--admin-border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `${color}10`,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--admin-muted)",
              marginBottom: 4,
            }}
          >
            {label}
          </p>
          {loading ? (
            <SkeletonPulse className="h-8 w-16" />
          ) : (
            <p style={{ fontSize: 28, fontWeight: 800, color: "var(--admin-text)", lineHeight: 1 }}>
              {value}
            </p>
          )}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}25, ${color}15)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color }}><Icon size={22} /></span>
        </div>
      </div>
    </div>
  );
}

function Money({
  label,
  value,
  loading,
  big,
  color,
  onClick,
}: {
  label: string;
  value?: number;
  loading?: boolean;
  big?: boolean;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-1"
        style={{ color: "var(--admin-muted)" }}
      >
        {label}
      </p>
      {loading ? (
        <SkeletonPulse className="h-8 w-24" />
      ) : (
        <p
          className={big ? "text-3xl font-extrabold" : "text-2xl font-bold"}
          style={{ color: color ?? "var(--admin-text)", lineHeight: 1.1 }}
        >
          ${(value ?? 0).toFixed(2)}
        </p>
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "16px 12px",
        borderRadius: 12,
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        cursor: "pointer",
        transition: "all 0.2s",
        color: "var(--admin-text)",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#6B4E3D";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(107,78,61,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--admin-border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: "rgba(107,78,61,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/studio/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const today = new Date().toLocaleDateString("es-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles size={24} style={{ color: "#6B4E3D" }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--admin-text)" }}
          >
            {greeting()}, Aluh
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--admin-muted)", marginLeft: 36 }}>
          {today}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Clientas"
          value={stats?.totalClients ?? 0}
          icon={Users}
          color="#6B4E3D"
          loading={loading}
          onClick={() => router.push("/studio/clients")}
        />
        <StatCard
          label="Citas activas"
          value={stats?.activeAppointments ?? 0}
          icon={Calendar}
          color="#2563EB"
          loading={loading}
          onClick={() => router.push("/studio/appointments?filter=upcoming")}
        />
        <StatCard
          label="Falta depósito"
          value={stats?.pendingDeposits ?? 0}
          icon={DollarSign}
          color="#F59E0B"
          loading={loading}
          onClick={() => router.push("/studio/appointments?filter=deposit")}
        />
        <StatCard
          label="Completadas"
          value={stats?.completedThisMonth ?? 0}
          icon={CheckCircle2}
          color="#10B981"
          loading={loading}
          onClick={() => router.push("/studio/appointments?filter=past")}
        />
      </div>

      {/* Money — the number worth seeing first thing in the morning */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Wallet size={18} style={{ color: "#6B4E3D" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--admin-text)" }}>
            Dinero cobrado
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Money label="Esta semana" value={stats?.money?.week} loading={loading} />
          <Money label="Este mes" value={stats?.money?.month} loading={loading} big />
          <Money label="Histórico" value={stats?.money?.allTime} loading={loading} />
          <Money
            label="Por cobrar"
            value={stats?.money?.outstanding}
            loading={loading}
            color="#B45309"
            onClick={() => router.push("/studio/appointments?filter=all")}
          />
        </div>

        <p className="text-xs mt-4" style={{ color: "var(--admin-muted)" }}>
          Cuenta los depósitos que marcaste como recibidos más los pagos
          registrados en cada cita. Si borras una cita, su dinero también se va.
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--admin-text)" }}
              >
                Esta semana
              </h2>
              <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
                Citas recibidas
              </p>
            </div>
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "rgba(16,185,129,0.1)",
                color: "#10B981",
              }}
            >
              <TrendingUp size={14} />
              Activo
            </div>
          </div>
          {loading ? (
            <SkeletonPulse className="h-[200px] w-full" />
          ) : (
            <WeeklyChart data={stats?.weeklyAppointments ?? []} />
          )}
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <h2
            className="text-base font-semibold mb-2"
            style={{ color: "var(--admin-text)" }}
          >
            Resumen de estados
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--admin-muted)" }}>
            Todas las citas
          </p>
          {loading ? (
            <SkeletonPulse className="h-[200px] w-full" />
          ) : (
            <StatusDonut data={stats?.statusDistribution ?? { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }} />
          )}
        </div>
      </div>

      {/* Bottom Row: Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--admin-text)" }}
            >
              Actividad reciente
            </h2>
            <Clock size={16} style={{ color: "var(--admin-muted)" }} />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonPulse className="h-9 w-9 !rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <SkeletonPulse className="h-4 w-32 mb-2" />
                    <SkeletonPulse className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.recentActivity?.length ? (
            <div className="text-center py-10">
              <Calendar size={40} style={{ color: "var(--admin-border)", margin: "0 auto 12px" }} />
              <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
Aún no hay actividad — las reservas nuevas aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentActivity.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => router.push(`/studio/appointments/${item.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--admin-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6B4E3D30, #6B4E3D15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={16} style={{ color: "#6B4E3D" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--admin-text)" }}
                      >
                        {item.title}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--admin-muted)" }}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className="text-xs"
                      style={{ color: "var(--admin-muted)" }}
                    >
                      {timeAgo(item.date)}
                    </span>
                    <ArrowUpRight size={14} style={{ color: "var(--admin-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <h2
            className="text-base font-semibold mb-5"
            style={{ color: "var(--admin-text)" }}
          >
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon={CalendarPlus}
              label="Nueva cita"
              onClick={() => router.push("/studio/appointments/new")}
            />
            <QuickAction
              icon={UserPlus}
              label="Nueva clienta"
              onClick={() => router.push("/studio/clients/new")}
            />
            <QuickAction
              icon={FileText}
              label="Editar contenido"
              onClick={() => router.push("/studio/content")}
            />
            <QuickAction
              icon={Calendar}
              label="Citas"
              onClick={() => router.push("/studio/appointments")}
            />
          </div>

          {/* Mini summary */}
          <div
            className="mt-5 rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, #6B4E3D15, #6B4E3D08)",
              border: "1px solid #6B4E3D20",
            }}
          >
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: "#6B4E3D" }}
            >
              💡 Consejo
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--admin-muted)" }}>
              ¡Mantén tu contenido al día! Actualiza tus servicios y precios en el{" "}
              <span
                className="cursor-pointer underline"
                style={{ color: "#6B4E3D" }}
                onClick={() => router.push("/studio/content")}
              >
                Editor de contenido
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
