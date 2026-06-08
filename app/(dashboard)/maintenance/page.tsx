import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { statusBadge, priorityBadge } from "@/components/ui/badge";
import { fmtDate, fmtCLP, woTypeLabel } from "@/lib/utils";
import { Wrench, Plus, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: { status?: string; type?: string; priority?: string; truckId?: string };
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const where: any = { orgId };
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.priority) where.priority = searchParams.priority;
  if (searchParams.truckId) where.truckId = searchParams.truckId;

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      truck: { select: { plate: true, brand: true, model: true, internalId: true } },
      mechanic: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [pending, inProgress, completed] = await Promise.all([
    prisma.workOrder.count({ where: { orgId, status: "PENDING" } }),
    prisma.workOrder.count({ where: { orgId, status: "IN_PROGRESS" } }),
    prisma.workOrder.count({ where: { orgId, status: "COMPLETED" } }),
  ]);

  const woTypeColors: Record<string, string> = {
    PREVENTIVO: "bg-green-50 text-green-700 border-green-200",
    CORRECTIVO: "bg-amber-50 text-amber-700 border-amber-200",
    EMERGENCIA: "bg-red-50 text-red-700 border-red-200",
    REVISION: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenciones</h1>
          <p className="text-sm text-slate-500">{workOrders.length} órdenes de trabajo</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/maintenance/calendar"
            className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Calendario
          </Link>
          <Link
            href="/maintenance/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva OT
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs text-slate-500">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
            <p className="text-xs text-slate-500">En Proceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completed}</p>
            <p className="text-xs text-slate-500">Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
          <Link
            key={s}
            href={s ? `/maintenance?status=${s}` : "/maintenance"}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              (searchParams.status || "") === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            {s === "" ? "Todos" : s === "PENDING" ? "Pendientes" : s === "IN_PROGRESS" ? "En Proceso" : s === "COMPLETED" ? "Completadas" : "Canceladas"}
          </Link>
        ))}
        <div className="w-px bg-slate-200 mx-1" />
        {["", "PREVENTIVO", "CORRECTIVO", "EMERGENCIA", "REVISION"].map((t) => (
          <Link
            key={t}
            href={t ? `/maintenance?type=${t}` : "/maintenance"}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              (searchParams.type || "") === t
                ? "bg-slate-700 text-white border-slate-700"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {t === "" ? "Todos Tipos" : woTypeLabel(t)}
          </Link>
        ))}
      </div>

      {/* Work Orders Table */}
      {workOrders.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin órdenes de trabajo</p>
          <p className="text-sm mb-4">
            {searchParams.status || searchParams.type || searchParams.truckId
              ? "No hay resultados para los filtros seleccionados"
              : "Crea la primera orden de trabajo para comenzar"}
          </p>
          {!searchParams.status && !searchParams.type && !searchParams.truckId && (
            <Link href="/maintenance/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              Nueva OT
            </Link>
          )}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">N° OT</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Camión</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mecánico</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Programado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-600">#{wo.number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/fleet/${wo.truckId}`} className="hover:text-blue-600 transition-colors">
                        <span className="font-medium text-slate-800">{wo.truck.plate}</span>
                        <br />
                        <span className="text-xs text-slate-400">{wo.truck.brand} {wo.truck.model}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${woTypeColors[wo.type] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {woTypeLabel(wo.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(wo.status)}</td>
                    <td className="px-4 py-3">{priorityBadge(wo.priority)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {wo.mechanic ? (
                        <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" />{wo.mechanic.name}</span>
                      ) : (
                        <span className="text-slate-300 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {wo.scheduledAt ? (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-400" />{fmtDate(wo.scheduledAt)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {wo.totalCost !== null && wo.totalCost !== undefined ? fmtCLP(wo.totalCost) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
