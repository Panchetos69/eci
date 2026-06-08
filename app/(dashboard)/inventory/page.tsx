import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCLP } from "@/lib/utils";
import { Package, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  const orgId = (session?.user as any)?.orgId;

  const items = await prisma.inventoryItem.findMany({
    where: { orgId },
    include: { supplier: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const lowStock = items.filter((i) => i.stock <= i.minStock);
  const outOfStock = items.filter((i) => i.stock === 0);
  const totalValue = items.reduce((s, i) => s + i.stock * i.costClp, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
        <p className="text-sm text-slate-500">{items.length} ítems registrados</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Package className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xl font-bold text-slate-800">{items.length}</p>
              <p className="text-xs text-slate-500">Total Ítems</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-xl font-bold text-red-600">{lowStock.length}</p>
              <p className="text-xs text-slate-500">Stock Bajo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="text-xl font-bold text-amber-600">{outOfStock.length}</p>
              <p className="text-xs text-slate-500">Sin Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-lg font-bold text-slate-800">{fmtCLP(totalValue)}</p>
              <p className="text-xs text-slate-500">Valor Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{lowStock.length} ítems</span> con stock bajo o agotado. Revisa y realiza pedidos.
          </p>
        </div>
      )}

      {/* Inventory table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Parte</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ubicación</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Actual</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Mínimo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Unit.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item) => {
                const isOut = item.stock === 0;
                const isLow = item.stock > 0 && item.stock <= item.minStock;
                const stockPct = item.minStock > 0 ? Math.min(100, (item.stock / (item.minStock * 3)) * 100) : 100;
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 ${isOut ? "bg-red-50/30" : isLow ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.partNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{item.location || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <span className={`font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800"}`}>
                          {item.stock} {item.unit}
                        </span>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1 w-16 ml-auto overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-green-500"}`}
                            style={{ width: `${stockPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{item.minStock} {item.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{fmtCLP(item.costClp)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{fmtCLP(item.stock * item.costClp)}</td>
                    <td className="px-4 py-3 text-slate-500">{item.supplier?.name || "—"}</td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <Badge variant="danger">Sin stock</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">Stock bajo</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-10">
              <Package className="h-10 w-10 mx-auto text-slate-200 mb-2" />
              <p className="text-slate-400 text-sm">Sin ítems de inventario</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
