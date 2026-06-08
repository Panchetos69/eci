import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, statusBadge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";
import { Truck, Plus, ChevronRight, Gauge, User, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: { status?: string; q?: string };
}

export default async function FleetPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const where: any = { orgId };
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.q) {
    where.OR = [
      { plate: { contains: searchParams.q, mode: "insensitive" } },
      { brand: { contains: searchParams.q, mode: "insensitive" } },
      { model: { contains: searchParams.q, mode: "insensitive" } },
      { internalId: { contains: searchParams.q, mode: "insensitive" } },
      { driverName: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }

  const trucks = await prisma.truck.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { workOrders: true, alerts: true } },
    },
  });

  const statuses = ["ACTIVE", "MAINTENANCE", "ALERT", "CRITICAL", "INACTIVE"];
  const counts = await prisma.truck.groupBy({
    by: ["status"],
    where: { orgId },
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Flota de Camiones</h1>
          <p className="text-sm text-slate-500">{trucks.length} unidades</p>
        </div>
        <Link
          href="/fleet/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Camión
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterLink href="/fleet" label="Todos" count={trucks.length + (searchParams.status ? 0 : 0)} active={!searchParams.status} />
        {statuses.map((s) => (
          <FilterLink
            key={s}
            href={`/fleet?status=${s}`}
            label={statusLabel(s)}
            count={countMap[s] || 0}
            active={searchParams.status === s}
          />
        ))}
      </div>

      {/* Search */}
      <form method="GET">
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Buscar por patente, marca, modelo o conductor..."
          className="w-full max-w-md bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* Truck Grid */}
      {trucks.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No se encontraron camiones</p>
          <p className="text-sm">Agrega tu primer camión para comenzar</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {trucks.map((truck) => {
            const pmProgress = truck.nextPmKm > 0
              ? Math.min(100, Math.round(((truck.currentKm - truck.lastPmKm) / (truck.nextPmKm - truck.lastPmKm)) * 100))
              : 0;
            const pmUrgent = truck.currentKm >= truck.nextPmKm * 0.95;
            return (
              <Link key={truck.id} href={`/fleet/${truck.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{truck.internalId}</span>
                          {statusBadge(truck.status)}
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{truck.plate}</h3>
                        <p className="text-sm text-slate-500">{truck.brand} {truck.model} {truck.year}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>

                    {/* KM */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 flex items-center gap-1"><Gauge className="h-3 w-3" /> {truck.currentKm.toLocaleString("es-CL")} km</span>
                        <span className={`${pmUrgent ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                          Próx. PM: {truck.nextPmKm.toLocaleString("es-CL")} km
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pmProgress >= 90 ? "bg-red-500" : pmProgress >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${pmProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Driver */}
                    {truck.driverName && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        <span>{truck.driverName}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {truck._count.alerts > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {truck._count.alerts} alerta{truck._count.alerts > 1 ? "s" : ""}
                          </span>
                        )}
                        <span>{truck._count.workOrders} OT</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    ACTIVE: "Activos", MAINTENANCE: "Mantención", ALERT: "Alerta",
    CRITICAL: "Críticos", INACTIVE: "Inactivos",
  };
  return m[s] || s;
}

function FilterLink({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`rounded-full text-[10px] px-1 ${active ? "bg-white/20" : "bg-slate-100"}`}>
          {count}
        </span>
      )}
    </Link>
  );
}
