import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, statusBadge, priorityBadge } from "@/components/ui/badge";
import { FuelBarChart, MaintenanceBarChart, FleetStatusPieChart } from "@/components/charts/dashboard-charts";
import { fmtDate, fmtCLP, daysUntil, docTypeLabel } from "@/lib/utils";
import {
  Truck, Wrench, AlertTriangle, Fuel, CheckCircle, TrendingUp,
  AlertCircle, Clock, FileText, ChevronRight
} from "lucide-react";
import Link from "next/link";
import QuickActions from "./QuickActions";
import { subMonths, format } from "date-fns";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const [
    totalTrucks,
    activeTrucks,
    maintenanceTrucks,
    criticalTrucks,
    pendingWOs,
    recentAlerts,
    upcomingWOs,
    expiringDocs,
    fuelLogs,
    workOrders,
  ] = await Promise.all([
    prisma.truck.count({ where: { orgId } }),
    prisma.truck.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.truck.count({ where: { orgId, status: "MAINTENANCE" } }),
    prisma.truck.count({ where: { orgId, OR: [{ status: "CRITICAL" }, { status: "ALERT" }] } }),
    prisma.workOrder.count({ where: { orgId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.alert.findMany({
      where: { orgId },
      include: { truck: { select: { plate: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.workOrder.findMany({
      where: { orgId, status: { in: ["PENDING", "IN_PROGRESS"] }, scheduledAt: { not: null } },
      include: { truck: { select: { plate: true, brand: true, model: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.truckDocument.findMany({
      where: {
        truck: { orgId },
        isActive: true,
        expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
      include: { truck: { select: { plate: true } } },
      orderBy: { expiresAt: "asc" },
      take: 5,
    }),
    prisma.fuelLog.findMany({
      where: { orgId, date: { gte: subMonths(new Date(), 6) } },
      orderBy: { date: "asc" },
    }),
    prisma.workOrder.findMany({
      where: { orgId, createdAt: { gte: subMonths(new Date(), 6) } },
    }),
  ]);

  // Monthly fuel cost for KPI
  const thisMonth = new Date();
  const monthlyFuelCost = fuelLogs
    .filter((f) => {
      const d = new Date(f.date);
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
    })
    .reduce((sum, f) => sum + (f.totalCost || f.liters * f.pricePerLiter), 0);

  const availability = totalTrucks > 0 ? Math.round((activeTrucks / totalTrucks) * 100) : 0;

  // Build last 6 months fuel chart data
  const fuelChartData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthLogs = fuelLogs.filter((f) => {
      const d = new Date(f.date);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
    return {
      month: format(date, "MMM", { locale: undefined }),
      liters: Math.round(monthLogs.reduce((s, f) => s + f.liters, 0)),
      cost: Math.round(monthLogs.reduce((s, f) => s + (f.totalCost || f.liters * f.pricePerLiter), 0)),
    };
  });

  // Build last 6 months maintenance chart data
  const maintenanceChartData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthWOs = workOrders.filter((w) => {
      const d = new Date(w.createdAt);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
    return {
      month: format(date, "MMM"),
      preventivo: monthWOs.filter((w) => w.type === "PREVENTIVO").length,
      correctivo: monthWOs.filter((w) => w.type === "CORRECTIVO").length,
      emergencia: monthWOs.filter((w) => w.type === "EMERGENCIA").length,
    };
  });

  // Fleet status pie
  const [inactiveTrucks] = await Promise.all([
    prisma.truck.count({ where: { orgId, status: "INACTIVE" } }),
  ]);
  const alertOnlyTrucks = await prisma.truck.count({ where: { orgId, status: "ALERT" } });
  const fleetStatusData = [
    { name: "Activos", value: activeTrucks },
    { name: "Mantención", value: maintenanceTrucks },
    { name: "Alerta", value: alertOnlyTrucks },
    { name: "Crítico", value: criticalTrucks - alertOnlyTrucks },
    { name: "Inactivos", value: inactiveTrucks },
  ].filter((d) => d.value > 0);

  const alertSeverityColor: Record<string, string> = {
    CRITICAL: "text-red-600 bg-red-50 border-red-200",
    WARNING: "text-amber-600 bg-amber-50 border-amber-200",
    INFO: "text-blue-600 bg-blue-50 border-blue-200",
  };
  const alertSeverityIcon: Record<string, typeof AlertCircle> = {
    CRITICAL: AlertCircle,
    WARNING: AlertTriangle,
    INFO: AlertCircle,
  };

  const unseenAlerts = recentAlerts.filter((a) => !a.seen).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumen del estado de la flota</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Acciones rápidas</h2>
        <QuickActions alertCount={unseenAlerts} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Camiones"
          value={totalTrucks}
          icon={<Truck className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <KpiCard
          title="Activos"
          value={activeTrucks}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <KpiCard
          title="En Mantención"
          value={maintenanceTrucks}
          icon={<Wrench className="h-5 w-5 text-amber-600" />}
          color="amber"
        />
        <KpiCard
          title="Alertas Críticas"
          value={criticalTrucks}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          color="red"
        />
        <KpiCard
          title="OT Pendientes"
          value={pendingWOs}
          icon={<Clock className="h-5 w-5 text-orange-600" />}
          color="orange"
        />
        <KpiCard
          title="Combustible Mes"
          value={fmtCLP(monthlyFuelCost)}
          icon={<Fuel className="h-5 w-5 text-purple-600" />}
          color="purple"
          small
        />
      </div>

      {/* Availability Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Disponibilidad de flota</span>
                <span className="text-sm font-bold text-slate-800">{availability}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    availability >= 80 ? "bg-green-500" : availability >= 60 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${availability}%` }}
                />
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              {activeTrucks}/{totalTrucks} camiones
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Estado de Flota</CardTitle>
          </CardHeader>
          <CardContent>
            <FleetStatusPieChart data={fleetStatusData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Consumo de Combustible (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <FuelBarChart data={fuelChartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Trabajo (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceBarChart data={maintenanceChartData} />
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alertas Recientes</CardTitle>
              <Link href="/alerts" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0 divide-y divide-slate-50">
            {recentAlerts.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6 px-4">Sin alertas recientes</p>
            )}
            {recentAlerts.map((alert) => {
              const Icon = alertSeverityIcon[alert.severity] || AlertCircle;
              const colorClass = alertSeverityColor[alert.severity] || alertSeverityColor.INFO;
              return (
                <div key={alert.id} className={`flex items-start gap-3 px-6 py-3 ${!alert.seen ? "bg-slate-50/50" : ""}`}>
                  <div className={`p-1.5 rounded-lg border ${colorClass} flex-shrink-0 mt-0.5`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{alert.title}</p>
                    <p className="text-xs text-slate-500 truncate">{alert.message}</p>
                  </div>
                  {!alert.seen && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Próximas Mantenciones</CardTitle>
              <Link href="/maintenance" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0 divide-y divide-slate-50">
            {upcomingWOs.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6 px-4">Sin mantenciones programadas</p>
            )}
            {upcomingWOs.map((wo) => (
              <Link
                key={wo.id}
                href={`/maintenance`}
                className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{wo.truck.plate} - {wo.truck.brand} {wo.truck.model}</p>
                  <p className="text-xs text-slate-500">{wo.scheduledAt ? fmtDate(wo.scheduledAt) : "Sin fecha"}</p>
                </div>
                {priorityBadge(wo.priority)}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Expiring Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documentos por Vencer</CardTitle>
              <Link href="/documents" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0 divide-y divide-slate-50">
            {expiringDocs.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6 px-4">Todos los documentos al día</p>
            )}
            {expiringDocs.map((doc) => {
              const days = daysUntil(doc.expiresAt);
              const isExpired = days < 0;
              const isUrgent = days >= 0 && days <= 7;
              return (
                <div key={doc.id} className="flex items-center gap-3 px-6 py-3">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${isExpired ? "bg-red-50" : isUrgent ? "bg-amber-50" : "bg-slate-50"}`}>
                    <FileText className={`h-4 w-4 ${isExpired ? "text-red-500" : isUrgent ? "text-amber-500" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{doc.truck.plate} - {docTypeLabel(doc.type)}</p>
                    <p className="text-xs text-slate-500">Vence: {fmtDate(doc.expiresAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isExpired ? "bg-red-100 text-red-700" : isUrgent ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {isExpired ? `Hace ${Math.abs(days)}d` : `${days}d`}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  color,
  small,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  small?: boolean;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    amber: "bg-amber-50",
    red: "bg-red-50",
    orange: "bg-orange-50",
    purple: "bg-purple-50",
  };
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgMap[color] || "bg-slate-50"}`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">{title}</p>
            <p className={`font-bold text-slate-800 ${small ? "text-base" : "text-2xl"}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
