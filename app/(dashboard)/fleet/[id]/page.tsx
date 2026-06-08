import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, statusBadge, priorityBadge } from "@/components/ui/badge";
import { fmtDate, fmtCLP, daysUntil, docTypeLabel, woTypeLabel } from "@/lib/utils";
import {
  ChevronLeft, Truck, User, Gauge, Fuel, Wrench, FileText,
  AlertTriangle, Phone, Hash, Calendar
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function TruckDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const truck = await prisma.truck.findFirst({
    where: { id: params.id, orgId },
    include: {
      documents: { orderBy: { expiresAt: "asc" } },
      workOrders: {
        include: { mechanic: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      fuelLogs: { orderBy: { date: "desc" }, take: 10 },
      faultReports: { orderBy: { createdAt: "desc" }, take: 10 },
      alerts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!truck) notFound();

  const pmProgress = truck.nextPmKm > 0
    ? Math.min(100, Math.round(((truck.currentKm - truck.lastPmKm) / (truck.nextPmKm - truck.lastPmKm)) * 100))
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/fleet" className="mt-1 p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">{truck.plate}</h1>
            {statusBadge(truck.status)}
          </div>
          <p className="text-slate-500">{truck.brand} {truck.model} · {truck.year} · ID: {truck.internalId}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/maintenance/new?truckId=${truck.id}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Wrench className="h-4 w-4" />
            Nueva OT
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-slate-500">Kilometraje Actual</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{truck.currentKm.toLocaleString("es-CL")} km</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-slate-500">Próximo PM</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{truck.nextPmKm.toLocaleString("es-CL")} km</p>
            <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${pmProgress >= 90 ? "bg-red-500" : pmProgress >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${pmProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Fuel className="h-4 w-4 text-green-500" />
              <span className="text-xs text-slate-500">Consumo Est.</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{truck.fuelEst} km/l</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-slate-500">Alertas Activas</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{truck.alerts.filter(a => !a.seen).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vehicle Info */}
        <Card>
          <CardHeader><CardTitle>Información del Vehículo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Patente" value={truck.plate} />
            <InfoRow label="Marca" value={truck.brand} />
            <InfoRow label="Modelo" value={truck.model} />
            <InfoRow label="Año" value={truck.year.toString()} />
            {truck.vin && <InfoRow label="VIN/Chasis" value={truck.vin} />}
            {truck.engine && <InfoRow label="Motor" value={truck.engine} />}
            {truck.tireSize && <InfoRow label="Neumáticos" value={truck.tireSize} />}
            {truck.maxWeight && <InfoRow label="Peso Máx." value={truck.maxWeight} />}
            {truck.color && <InfoRow label="Color" value={truck.color} />}
            <InfoRow label="Intervalo PM" value={`${truck.pmInterval.toLocaleString("es-CL")} km`} />
          </CardContent>
        </Card>

        {/* Driver Info */}
        <Card>
          <CardHeader><CardTitle>Conductor Asignado</CardTitle></CardHeader>
          <CardContent>
            {truck.driverName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {truck.driverName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{truck.driverName}</p>
                    {truck.driverRut && <p className="text-sm text-slate-500">RUT: {truck.driverRut}</p>}
                  </div>
                </div>
                {truck.driverPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {truck.driverPhone}
                  </div>
                )}
                {truck.driverLicense && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Hash className="h-4 w-4 text-slate-400" />
                    Licencia: {truck.driverLicense}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Sin conductor asignado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos</CardTitle>
            <Link href="/documents" className="text-xs text-blue-600 hover:underline">Gestionar</Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {truck.documents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 px-4 italic">Sin documentos registrados</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {truck.documents.map((doc) => {
                const days = daysUntil(doc.expiresAt);
                const isExpired = days < 0;
                const isUrgent = days >= 0 && days <= 15;
                return (
                  <div key={doc.id} className="flex items-center gap-4 px-6 py-3">
                    <FileText className={`h-5 w-5 flex-shrink-0 ${isExpired ? "text-red-500" : isUrgent ? "text-amber-500" : "text-green-500"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{docTypeLabel(doc.type)}</p>
                      {doc.folio && <p className="text-xs text-slate-400">Folio: {doc.folio}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{fmtDate(doc.expiresAt)}</p>
                      <p className={`text-xs font-medium ${isExpired ? "text-red-600" : isUrgent ? "text-amber-600" : "text-green-600"}`}>
                        {isExpired ? `Vencido hace ${Math.abs(days)}d` : `${days} días restantes`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Órdenes de Trabajo Recientes</CardTitle>
            <Link href={`/maintenance?truckId=${truck.id}`} className="text-xs text-blue-600 hover:underline">Ver todas</Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {truck.workOrders.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 px-4 italic">Sin órdenes de trabajo</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {truck.workOrders.map((wo) => (
                <div key={wo.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-slate-400">#{wo.number}</span>
                      <span className="text-sm font-medium text-slate-800">{woTypeLabel(wo.type)}</span>
                      {priorityBadge(wo.priority)}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{wo.description || "Sin descripción"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{fmtDate(wo.createdAt)}</p>
                    {wo.totalCost !== null && wo.totalCost !== undefined && (
                      <p className="text-xs font-medium text-slate-700">{fmtCLP(wo.totalCost)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuel logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cargas de Combustible Recientes</CardTitle>
            <Link href={`/fuel?truckId=${truck.id}`} className="text-xs text-blue-600 hover:underline">Ver todas</Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {truck.fuelLogs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 px-4 italic">Sin cargas de combustible</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {truck.fuelLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 px-6 py-3">
                  <Fuel className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{log.liters.toLocaleString("es-CL")} L · {fmtCLP(log.pricePerLiter)}/L</p>
                    <p className="text-xs text-slate-500">{log.kmAtLoad.toLocaleString("es-CL")} km · {log.location || "Sin ubicación"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{fmtDate(log.date)}</p>
                    <p className="text-sm font-semibold text-slate-700">{fmtCLP(log.totalCost || log.liters * log.pricePerLiter)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fault Reports */}
      <Card>
        <CardHeader><CardTitle>Reportes de Fallas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {truck.faultReports.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 px-4 italic">Sin reportes de fallas</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {truck.faultReports.map((fault) => (
                <div key={fault.id} className="flex items-start gap-4 px-6 py-3">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    fault.severity === "CRITICAL" ? "text-red-500" : fault.severity === "HIGH" ? "text-orange-500" : "text-amber-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{fault.component} · {fault.faultType}</p>
                    {fault.description && <p className="text-xs text-slate-500 truncate">{fault.description}</p>}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{fmtDate(fault.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}
