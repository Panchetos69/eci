import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fmtCLP, fmtDate } from "@/lib/utils";
import { BarChart3, TrendingUp, Wrench, Fuel, AlertTriangle } from "lucide-react";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { FuelBarChart, MaintenanceBarChart } from "@/components/charts/dashboard-charts";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const now = new Date();

  const [fuelLogs, workOrders, trucks, faultReports] = await Promise.all([
    prisma.fuelLog.findMany({ where: { orgId }, orderBy: { date: "asc" } }),
    prisma.workOrder.findMany({ where: { orgId } }),
    prisma.truck.findMany({ where: { orgId } }),
    prisma.faultReport.findMany({ where: { orgId } }),
  ]);

  // Build 6-month chart data
  const fuelChartData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(now, 5 - i);
    const monthLogs = fuelLogs.filter((f) => {
      const d = new Date(f.date);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
    return {
      month: format(date, "MMM"),
      liters: Math.round(monthLogs.reduce((s, f) => s + f.liters, 0)),
      cost: Math.round(monthLogs.reduce((s, f) => s + (f.totalCost || f.liters * f.pricePerLiter), 0)),
    };
  });

  const maintenanceChartData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(now, 5 - i);
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

  // Totals
  const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.totalCost || f.liters * f.pricePerLiter), 0);
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const totalWOCost = workOrders.reduce((s, w) => s + (w.totalCost || 0), 0);
  const completedWOs = workOrders.filter((w) => w.status === "COMPLETED").length;
  const avgLaborHours = workOrders.filter((w) => w.laborHours).length > 0
    ? workOrders.reduce((s, w) => s + (w.laborHours || 0), 0) / workOrders.filter((w) => w.laborHours).length
    : 0;

  // Top trucks by fuel consumption
  const truckFuel = trucks.map((t) => {
    const logs = fuelLogs.filter((f) => f.truckId === t.id);
    return {
      truck: t,
      liters: logs.reduce((s, f) => s + f.liters, 0),
      cost: logs.reduce((s, f) => s + (f.totalCost || f.liters * f.pricePerLiter), 0),
    };
  }).sort((a, b) => b.liters - a.liters).slice(0, 5);

  // Top trucks by maintenance cost
  const truckMaintenance = trucks.map((t) => {
    const wos = workOrders.filter((w) => w.truckId === t.id);
    return {
      truck: t,
      count: wos.length,
      cost: wos.reduce((s, w) => s + (w.totalCost || 0), 0),
    };
  }).sort((a, b) => b.cost - a.cost).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
        <p className="text-sm text-slate-500">Resumen de operaciones y costos</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Fuel className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-slate-500">Costo Total Combustible</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{fmtCLP(totalFuelCost)}</p>
            <p className="text-xs text-slate-400">{totalLiters.toLocaleString("es-CL")} litros totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-slate-500">Costo Total Mantención</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{fmtCLP(totalWOCost)}</p>
            <p className="text-xs text-slate-400">{workOrders.length} OTs totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-slate-500">OTs Completadas</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{completedWOs}</p>
            <p className="text-xs text-slate-400">
              {workOrders.length > 0 ? Math.round((completedWOs / workOrders.length) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-slate-500">Fallas Reportadas</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{faultReports.length}</p>
            <p className="text-xs text-slate-400">{faultReports.filter((f) => f.status === "OPEN").length} abiertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Combustible por Mes (Litros)</CardTitle></CardHeader>
          <CardContent>
            <FuelBarChart data={fuelChartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mantenciones por Mes</CardTitle></CardHeader>
          <CardContent>
            <MaintenanceBarChart data={maintenanceChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Top trucks tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top 5 por Consumo de Combustible</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">#</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Camión</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Litros</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {truckFuel.map((t, i) => (
                  <tr key={t.truck.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-400 font-bold">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{t.truck.plate}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{t.liters.toLocaleString("es-CL")} L</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800">{fmtCLP(t.cost)}</td>
                  </tr>
                ))}
                {truckFuel.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400 text-sm">Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top 5 por Costo de Mantención</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">#</th>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Camión</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">OTs</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Costo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {truckMaintenance.map((t, i) => (
                  <tr key={t.truck.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-400 font-bold">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{t.truck.plate}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700">{t.count}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800">{fmtCLP(t.cost)}</td>
                  </tr>
                ))}
                {truckMaintenance.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400 text-sm">Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
