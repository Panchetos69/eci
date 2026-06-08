import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fmtDate, fmtCLP } from "@/lib/utils";
import { Fuel, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

type FuelLogWithTruck = Awaited<ReturnType<typeof prisma.fuelLog.findMany>>[0] & {
  truck: { plate: string; brand: string; model: string; internalId: string; fleetType: string };
};

export default async function FuelPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const now = new Date();
  const startThisMonth = startOfMonth(now);
  const startLastMonth = startOfMonth(subMonths(now, 1));
  const endLastMonth = endOfMonth(subMonths(now, 1));

  const [allLogs, trucksWithFuel] = await Promise.all([
    prisma.fuelLog.findMany({
      where: { orgId },
      include: { truck: { select: { plate: true, brand: true, model: true, internalId: true, fleetType: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.truck.findMany({
      where: { orgId, status: { not: "INACTIVE" } },
      include: {
        fuelLogs: {
          where: { orgId, date: { gte: startThisMonth } },
        },
      },
    }),
  ]);

  const thisMonthLogs = allLogs.filter((l) => new Date(l.date) >= startThisMonth);
  const lastMonthLogs = allLogs.filter((l) => {
    const d = new Date(l.date);
    return d >= startLastMonth && d <= endLastMonth;
  });

  const thisMonthCost = thisMonthLogs.reduce((s, l) => s + (l.totalCost || l.liters * l.pricePerLiter), 0);
  const lastMonthCost = lastMonthLogs.reduce((s, l) => s + (l.totalCost || l.liters * l.pricePerLiter), 0);
  const thisMonthLiters = thisMonthLogs.reduce((s, l) => s + l.liters, 0);
  const costChange = lastMonthCost > 0 ? ((thisMonthCost - lastMonthCost) / lastMonthCost) * 100 : 0;

  const avgPricePerLiter = thisMonthLogs.length > 0
    ? thisMonthLogs.reduce((s, l) => s + l.pricePerLiter, 0) / thisMonthLogs.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Combustible</h1>
          <p className="text-sm text-slate-500">{allLogs.length} registros totales</p>
        </div>
        <Link
          href="/fuel/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Registrar Carga
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500 mb-1">Costo Este Mes</p>
            <p className="text-xl font-bold text-slate-800">{fmtCLP(thisMonthCost)}</p>
            <p className={`text-xs mt-1 flex items-center gap-1 ${costChange > 0 ? "text-red-500" : costChange < 0 ? "text-green-500" : "text-slate-400"}`}>
              {costChange > 0 ? <TrendingUp className="h-3 w-3" /> : costChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(costChange).toFixed(1)}% vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500 mb-1">Litros Este Mes</p>
            <p className="text-xl font-bold text-slate-800">{thisMonthLiters.toLocaleString("es-CL")} L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500 mb-1">Precio Prom. Mes</p>
            <p className="text-xl font-bold text-slate-800">{fmtCLP(avgPricePerLiter)}/L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-500 mb-1">Cargas Realizadas</p>
            <p className="text-xl font-bold text-slate-800">{thisMonthLogs.length}</p>
            <p className="text-xs text-slate-400">este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-truck comparison */}
      <Card>
        <CardHeader><CardTitle>Consumo por Camión (Mes Actual)</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Camión</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Litros</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargas</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio Prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trucksWithFuel
                .filter((t) => t.fuelLogs.length > 0)
                .sort((a, b) => {
                  const aLiters = a.fuelLogs.reduce((s, l) => s + l.liters, 0);
                  const bLiters = b.fuelLogs.reduce((s, l) => s + l.liters, 0);
                  return bLiters - aLiters;
                })
                .map((truck) => {
                  const liters = truck.fuelLogs.reduce((s, l) => s + l.liters, 0);
                  const cost = truck.fuelLogs.reduce((s, l) => s + (l.totalCost || l.liters * l.pricePerLiter), 0);
                  const avgPrice = liters > 0 ? cost / liters : 0;
                  return (
                    <tr key={truck.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/fleet/${truck.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                          {truck.plate}
                        </Link>
                        <br />
                        <span className="text-xs text-slate-400">{truck.brand} {truck.model}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{liters.toLocaleString("es-CL")} L</td>
                      <td className="px-4 py-3 text-right text-slate-700">{truck.fuelLogs.length}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{fmtCLP(cost)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmtCLP(avgPrice)}/L</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {trucksWithFuel.every((t) => t.fuelLogs.length === 0) && (
            <p className="text-center text-slate-400 py-6 text-sm">Sin cargas este mes</p>
          )}
        </div>
      </Card>

      {/* Recent logs */}
      <Card>
        <CardHeader><CardTitle>Registros Recientes</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Camión</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Litros</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio/L</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Km / Horas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allLogs.slice(0, 30).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(log.date)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/fleet/${log.truckId}`} className="font-medium text-slate-800 hover:text-blue-600">
                      {log.truck.plate}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{log.liters.toLocaleString("es-CL")} L</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmtCLP(log.pricePerLiter)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{fmtCLP(log.totalCost || log.liters * log.pricePerLiter)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {(log as any).truck.fleetType === "INDUSTRIAL" && log.engineHours
                      ? `${log.engineHours.toLocaleString("es-CL")} h`
                      : `${log.kmAtLoad.toLocaleString("es-CL")} km`}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {allLogs.length === 0 && (
            <div className="text-center py-10">
              <Fuel className="h-10 w-10 mx-auto text-slate-200 mb-2" />
              <p className="text-slate-400 text-sm">Sin registros de combustible</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
