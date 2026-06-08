"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Truck {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTruckId = searchParams.get("truckId") || "";

  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trucks").then(r => r.json()).then(d => setTrucks(d.trucks || []));
    fetch("/api/users").then(r => r.json()).then(d => setMechanics(d.users?.filter((u: User) => u.role === "MECHANIC" || u.role === "SUPERVISOR") || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        kmAtCreate: parseInt(data.kmAtCreate as string) || 0,
        laborHours: data.laborHours ? parseFloat(data.laborHours as string) : null,
        totalCost: data.totalCost ? parseFloat(data.totalCost as string) : null,
        scheduledAt: data.scheduledAt || null,
        mechanicId: data.mechanicId || null,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Error al crear OT");
    } else {
      router.push("/maintenance");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/maintenance" className="p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nueva Orden de Trabajo</h1>
          <p className="text-sm text-slate-500">Registra una nueva orden de trabajo</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Camión *</label>
              <select name="truckId" defaultValue={defaultTruckId} required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecciona un camión...</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>{t.plate} - {t.brand} {t.model}</option>
                ))}
              </select>
            </div>
            <Select name="type" label="Tipo de OT *" required>
              <option value="PREVENTIVO">Preventivo</option>
              <option value="CORRECTIVO">Correctivo</option>
              <option value="EMERGENCIA">Emergencia</option>
              <option value="REVISION">Revisión</option>
            </Select>
            <Select name="priority" label="Prioridad">
              <option value="LOW">Baja</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </Select>
            <Select name="status" label="Estado">
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En Proceso</option>
              <option value="COMPLETED">Completado</option>
            </Select>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mecánico Asignado</label>
              <select name="mechanicId"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin asignar</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <Input name="kmAtCreate" label="Kilometraje al Crear *" type="number" placeholder="0" min="0" required />
            <Input name="scheduledAt" label="Fecha Programada" type="datetime-local" />
            <Input name="laborHours" label="Horas de Labor" type="number" step="0.5" placeholder="0" />
            <Input name="totalCost" label="Costo Total (CLP)" type="number" placeholder="0" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea name="description" label="Descripción del Trabajo *" required
              placeholder="Describe el trabajo a realizar..." rows={3} />
            <Textarea name="observations" label="Observaciones"
              placeholder="Observaciones adicionales..." rows={2} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/maintenance">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear Orden de Trabajo"}
          </Button>
        </div>
      </form>
    </div>
  );
}
