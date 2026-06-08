import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fmtDatetime } from "@/lib/utils";
import { AlertTriangle, Info, Bell, CheckCircle2, BellOff } from "lucide-react";
import Link from "next/link";
import MarkAllSeenButton from "./mark-all-seen-button";

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const alerts = await prisma.alert.findMany({
    where: { orgId },
    include: { truck: { select: { plate: true } } },
    orderBy: [{ seen: "asc" }, { createdAt: "desc" }],
  });

  const unseen = alerts.filter((a) => !a.seen).length;
  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL");
  const warningAlerts = alerts.filter((a) => a.severity === "WARNING");
  const infoAlerts = alerts.filter((a) => a.severity === "INFO");

  const severityStyles: Record<string, { bg: string; icon: typeof AlertTriangle; iconColor: string; border: string }> = {
    CRITICAL: { bg: "bg-red-50", icon: AlertTriangle, iconColor: "text-red-500", border: "border-red-200" },
    WARNING: { bg: "bg-amber-50", icon: AlertTriangle, iconColor: "text-amber-500", border: "border-amber-200" },
    INFO: { bg: "bg-blue-50", icon: Info, iconColor: "text-blue-500", border: "border-blue-200" },
  };

  const alertTypeLabel: Record<string, string> = {
    PM_DUE: "PM Próximo",
    DOCUMENT_EXPIRY: "Documento por Vencer",
    LOW_STOCK: "Stock Bajo",
    HIGH_FUEL: "Consumo Alto",
    FAULT_REPORTED: "Falla Reportada",
    SYSTEM: "Sistema",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alertas</h1>
          <p className="text-sm text-slate-500">{unseen} alertas sin leer de {alerts.length} totales</p>
        </div>
        {unseen > 0 && <MarkAllSeenButton />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-xl font-bold text-slate-800">{criticalAlerts.length}</p>
              <p className="text-xs text-slate-500">Críticas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Bell className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="text-xl font-bold text-slate-800">{warningAlerts.length}</p>
              <p className="text-xs text-slate-500">Advertencias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Info className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-xl font-bold text-slate-800">{infoAlerts.length}</p>
              <p className="text-xs text-slate-500">Informativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BellOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin alertas</p>
          <p className="text-sm">Todo está en orden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[
            { label: "Críticas", items: criticalAlerts },
            { label: "Advertencias", items: warningAlerts },
            { label: "Informativas", items: infoAlerts },
          ].map(({ label, items }) =>
            items.length > 0 ? (
              <div key={label}>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">{label}</h2>
                <div className="space-y-2">
                  {items.map((alert) => {
                    const style = severityStyles[alert.severity];
                    const Icon = style.icon;
                    return (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border ${style.border} ${alert.seen ? "opacity-60" : ""} ${style.bg}`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 ${style.iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-semibold text-slate-800 text-sm">{alert.title}</span>
                            {!alert.seen && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                            <span className="text-xs text-slate-400 bg-white/60 px-1.5 py-0.5 rounded">
                              {alertTypeLabel[alert.type] || alert.type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{alert.message}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {alert.truck && (
                              <Link href={`/fleet/${alert.truckId}`} className="hover:text-blue-600 hover:underline">
                                Camión: {alert.truck.plate}
                              </Link>
                            )}
                            <span>{fmtDatetime(alert.createdAt)}</span>
                          </div>
                        </div>
                        {alert.seen && (
                          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
