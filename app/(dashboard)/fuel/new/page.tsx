"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  currentKm: number;
}

export default function NewFuelLogPage() {
  const router = useRouter();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    fetch("/api/trucks").then((r) => r.json()).then((d) => setTrucks(d.trucks || []));
  }, []);

  const totalCost = liters && price ? (parseFloat(liters) * parseFloat(price)).toLocaleString("es-CL") : "—";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        liters: parseFloat(data.liters as string),
        pricePerLiter: parseFloat(data.pricePerLiter as string),
        kmAtLoad: parseInt(data.kmAtLoad as string),
        totalCost: parseFloat(data.liters as string) * parseFloat(data.pricePerLiter as string),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Error al registrar carga");
    } else {
      router.push("/fuel");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fuel" className="p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registrar Carga de Combustible</h1>
          <p className="text-sm text-slate-500">Ingresa los datos de la carga</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Datos de la Carga</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Camión *</label>
              <select name="truckId" required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecciona un camión...</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>{t.plate} - {t.brand} {t.model} ({t.currentKm.toLocaleString("es-CL")} km)</option>
                ))}
              </select>
            </div>
            <Input name="date" label="Fecha y Hora *" type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)} required />
            <Select name="fuelType" label="Tipo de Combustible">
              <option value="Diesel BS10">Diesel BS10</option>
              <option value="Diesel">Diesel</option>
              <option value="Benzoil 93">Benzoil 93</option>
              <option value="Benzoil 95">Benzoil 95</option>
              <option value="Benzoil 97">Benzoil 97</option>
            </Select>
            <Input name="liters" label="Litros Cargados *" type="number" step="0.1" min="0"
              placeholder="0" required value={liters} onChange={(e) => setLiters(e.target.value)} />
            <Input name="pricePerLiter" label="Precio por Litro (CLP) *" type="number" step="1" min="0"
              placeholder="1100" required value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input name="kmAtLoad" label="Kilometraje al Cargar *" type="number" min="0" placeholder="0" required />
            <Input name="location" label="Ubicación / Grifo" placeholder="Ej: COPEC Ruta 5, Santiago" />
            <Input name="driverName" label="Nombre del Conductor" placeholder="Nombre del conductor" />
            <Input name="hoursWorked" label="Horas Trabajadas" type="number" step="0.5" placeholder="0" />

            {/* Total cost display */}
            <div className="sm:col-span-2 bg-blue-50 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Costo Total Calculado</span>
                <span className="text-xl font-bold text-blue-800">$ {totalCost}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
          <CardContent>
            <Textarea name="notes" placeholder="Observaciones adicionales..." rows={2} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/fuel">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Registrar Carga"}
          </Button>
        </div>
      </form>
    </div>
  );
}
