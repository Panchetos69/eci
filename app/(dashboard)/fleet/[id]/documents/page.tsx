"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fmtDate, daysUntil, docTypeLabel } from "@/lib/utils";
import { FileText, Plus, Trash2, ChevronLeft, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
import Link from "next/link";

interface Truck {
  id: string;
  plate: string;
  brand: string;
  model: string;
  internalId: string;
}

interface TruckDocument {
  id: string;
  type: string;
  expiresAt: string;
  folio: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

const DOC_TYPES = [
  { value: "SOAP", label: "SOAP" },
  { value: "RVT", label: "Revisión Técnica" },
  { value: "PERMISO_CIRCULACION", label: "Permiso Circulación" },
  { value: "SEGURO_RC", label: "Seguro RC" },
  { value: "TAG", label: "TAG" },
  { value: "OTRO", label: "Otro" },
];

export default function TruckDocumentsPage() {
  const params = useParams();
  const truckId = params.id as string;

  const [truck, setTruck] = useState<Truck | null>(null);
  const [documents, setDocuments] = useState<TruckDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form state
  const [formType, setFormType] = useState("SOAP");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formFolio, setFormFolio] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [truckRes, docsRes] = await Promise.all([
        fetch(`/api/trucks/${truckId}`),
        fetch(`/api/trucks/${truckId}/documents`),
      ]);
      if (truckRes.ok) {
        const data = await truckRes.json();
        setTruck(data.truck);
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }
    } finally {
      setLoading(false);
    }
  }, [truckId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const res = await fetch(`/api/trucks/${truckId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formType,
        expiresAt: formExpiresAt,
        folio: formFolio || null,
        notes: formNotes || null,
      }),
    });

    setFormLoading(false);
    if (res.ok) {
      setShowForm(false);
      setFormType("SOAP");
      setFormExpiresAt("");
      setFormFolio("");
      setFormNotes("");
      setSuccessMsg("Documento agregado correctamente");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadData();
    } else {
      const err = await res.json();
      setFormError(err.error || "Error al agregar documento");
    }
  }

  async function handleDelete(docId: string) {
    setDeleteLoading(true);
    const res = await fetch(`/api/trucks/${truckId}/documents?docId=${docId}`, {
      method: "DELETE",
    });
    setDeleteLoading(false);
    if (res.ok) {
      setDeleteConfirm(null);
      setSuccessMsg("Documento eliminado");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadData();
    }
  }

  const expired = documents.filter((d) => daysUntil(d.expiresAt) < 0);
  const warning = documents.filter((d) => {
    const days = daysUntil(d.expiresAt);
    return days >= 0 && days < 30;
  });
  const ok = documents.filter((d) => daysUntil(d.expiresAt) >= 30);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Cargando documentos...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/fleet" className="hover:text-blue-600 transition-colors">Flota</Link>
        <span>/</span>
        <Link href={`/fleet/${truckId}`} className="hover:text-blue-600 transition-colors">
          {truck?.plate || "..."}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Documentos</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={`/fleet/${truckId}`} className="mt-1 p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Documentos</h1>
          {truck && (
            <p className="text-slate-500 text-sm">{truck.plate} · {truck.brand} {truck.model} · ID: {truck.internalId}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancelar" : "Agregar documento"}
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Add document form (collapsible) */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base">Nuevo Documento</CardTitle>
          </CardHeader>
          <CardContent>
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddDocument} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DOC_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento *</label>
                <input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Folio / N° Documento</label>
                <input
                  type="text"
                  value={formFolio}
                  onChange={(e) => setFormFolio(e.target.value)}
                  placeholder="Ej: 1234567-8"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observaciones..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {formLoading ? "Guardando..." : "Guardar documento"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
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
              <p className="text-xl font-bold text-amber-600">{warning.length}</p>
              <p className="text-xs text-slate-500">Por vencer</p>
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

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin documentos registrados</p>
          <p className="text-sm mb-4">Agrega el primer documento para este camión</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar documento
          </button>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Folio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => {
                  const days = daysUntil(doc.expiresAt);
                  const isExpired = days < 0;
                  const isWarning = days >= 0 && days < 30;
                  const isOk = days >= 30;

                  return (
                    <tr key={doc.id} className={`hover:bg-slate-50 ${isExpired ? "bg-red-50/30" : isWarning ? "bg-amber-50/20" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className={`h-4 w-4 flex-shrink-0 ${isExpired ? "text-red-500" : isWarning ? "text-amber-500" : "text-green-500"}`} />
                          <span className="font-medium text-slate-800">{docTypeLabel(doc.type)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{doc.folio || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{fmtDate(doc.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          isExpired
                            ? "bg-red-100 text-red-700"
                            : isWarning
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {isExpired
                            ? `Vencido hace ${Math.abs(days)}d`
                            : isWarning
                            ? `Vence en ${days}d`
                            : `Vigente (${days}d)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate">{doc.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {deleteConfirm === doc.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-slate-600">¿Eliminar?</span>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleteLoading}
                              className="text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded-lg transition-colors"
                            >
                              {deleteLoading ? "..." : "Sí"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
