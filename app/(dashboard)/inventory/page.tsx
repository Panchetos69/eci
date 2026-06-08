"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCLP } from "@/lib/utils";
import { Package, AlertTriangle, TrendingDown, CheckCircle, Plus, X, CheckCircle2 } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  partNumber: string | null;
  stock: number;
  minStock: number;
  unit: string;
  costClp: number;
  location: string | null;
  supplier: { name: string } | null;
  notes: string | null;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("1");
  const [unit, setUnit] = useState("unid");
  const [costClp, setCostClp] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/inventory");
      if (r.ok) {
        const d = await r.json();
        setItems(d.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  function resetForm() {
    setName(""); setPartNumber(""); setStock(""); setMinStock("1");
    setUnit("unid"); setCostClp(""); setLocation(""); setNotes("");
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, partNumber: partNumber || null, stock, minStock, unit, costClp, location: location || null, notes: notes || null }),
    });
    setFormLoading(false);
    if (res.ok) {
      setShowForm(false);
      resetForm();
      setSuccessMsg("Ítem agregado correctamente");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadItems();
    } else {
      const err = await res.json();
      setFormError(err.error || "Error al agregar ítem");
    }
  }

  const lowStock = items.filter((i) => i.stock <= i.minStock);
  const outOfStock = items.filter((i) => i.stock === 0);
  const totalValue = items.reduce((s, i) => s + i.stock * i.costClp, 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-400">Cargando inventario...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-sm text-slate-500">{items.length} ítems registrados</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); if (showForm) resetForm(); }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancelar" : "Agregar ítem"}
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader><CardTitle className="text-base">Nuevo Ítem de Inventario</CardTitle></CardHeader>
          <CardContent>
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Filtro de aceite" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">N° Parte</label>
                <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="Ej: 15400-PLC-003" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="unid">unid</option>
                  <option value="litros">litros</option>
                  <option value="kg">kg</option>
                  <option value="metros">metros</option>
                  <option value="cajas">cajas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Actual *</label>
                <input type="number" step="0.1" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required placeholder="0" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo *</label>
                <input type="number" step="0.1" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} required placeholder="1" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo Unitario (CLP)</label>
                <input type="number" step="1" min="0" value={costClp} onChange={(e) => setCostClp(e.target.value)} placeholder="0" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Bodega A, estante 3" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors">
                  {formLoading ? "Guardando..." : "Guardar ítem"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin ítems de inventario</p>
          <p className="text-sm mb-4">Agrega el primer ítem para comenzar</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar ítem
          </button>
        </div>
      ) : (
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
          </div>
        </Card>
      )}
    </div>
  );
}
