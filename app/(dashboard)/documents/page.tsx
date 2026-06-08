import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { fmtDate, daysUntil, docTypeLabel } from "@/lib/utils";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const documents = await prisma.truckDocument.findMany({
    where: { truck: { orgId }, isActive: true },
    include: { truck: { select: { plate: true, brand: true, model: true } } },
    orderBy: { expiresAt: "asc" },
  });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expired = documents.filter((d) => new Date(d.expiresAt) < now);
  const expiringSoon = documents.filter((d) => new Date(d.expiresAt) >= now && new Date(d.expiresAt) <= in30Days);
  const ok = documents.filter((d) => new Date(d.expiresAt) > in30Days);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Documentos de Flota</h1>
        <p className="text-sm text-slate-500">{documents.length} documentos activos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-xl font-bold text-red-600">{expired.length}</p>
              <p className="text-xs text-slate-500">Vencidos</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="text-xl font-bold text-amber-600">{expiringSoon.length}</p>
              <p className="text-xs text-slate-500">Por vencer (&lt;30d)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 p-4">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-xl font-bold text-green-600">{ok.length}</p>
              <p className="text-xs text-slate-500">Vigentes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Document sections */}
      {[
        { label: "Vencidos", docs: expired, emptyMsg: "Sin documentos vencidos" },
        { label: "Por Vencer (próximos 30 días)", docs: expiringSoon, emptyMsg: null },
        { label: "Vigentes", docs: ok, emptyMsg: null },
      ].map(({ label, docs, emptyMsg }) =>
        docs.length > 0 || emptyMsg ? (
          <div key={label}>
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              {label}
              {docs.length > 0 && (
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{docs.length}</span>
              )}
            </h2>
            {docs.length === 0 && emptyMsg ? (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{emptyMsg}</p>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Camión</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Folio</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {docs.map((doc) => {
                        const days = daysUntil(doc.expiresAt);
                        const isExpired = days < 0;
                        const isUrgent = !isExpired && days <= 15;
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <Link href={`/fleet/${doc.truckId}/documents`} className="font-medium text-slate-800 hover:text-blue-600">
                                {doc.truck.plate}
                              </Link>
                              <br />
                              <span className="text-xs text-slate-400">{doc.truck.brand} {doc.truck.model}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FileText className={`h-4 w-4 ${isExpired ? "text-red-400" : isUrgent ? "text-amber-400" : "text-green-400"}`} />
                                <span className="font-medium text-slate-700">{docTypeLabel(doc.type)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{doc.folio || "—"}</td>
                            <td className="px-4 py-3 text-slate-700">{fmtDate(doc.expiresAt)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                isExpired ? "bg-red-100 text-red-700" : isUrgent ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                              }`}>
                                {isExpired ? `Vencido hace ${Math.abs(days)}d` : `${days} días`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        ) : null
      )}

      {documents.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin documentos registrados</p>
          <p className="text-sm mb-4">Los documentos aparecerán aquí cuando los registres en cada camión</p>
        <Link href="/fleet" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          Ir a la flota
        </Link>
        </div>
      )}
    </div>
  );
}
