"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewTruckPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/trucks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        year: parseInt(data.year as string),
        currentKm: parseInt(data.currentKm as string) || 0,
        pmInterval: parseInt(data.pmInterval as string) || 10000,
        fuelEst: parseFloat(data.fuelEst as string) || 30,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Error al crear camión");
    } else {
      router.push("/fleet");
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fleet" className="p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agregar Camión</h1>
          <p className="text-sm text-slate-500">Registra un nuevo vehículo en la flota</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificación */}
        <Card>
          <CardHeader><CardTitle>Identificación del Vehículo</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Input name="internalId" label="ID Interno *" placeholder="Ej: CAM-001" required />
            <Input name="plate" label="Patente *" placeholder="Ej: BDLZ-12" required />
            <Input name="brand" label="Marca *" placeholder="Ej: Volvo, Mercedes, Scania" required />
            <Input name="model" label="Modelo *" placeholder="Ej: FH16, Actros 2658" required />
            <Input name="year" label="Año *" type="number" placeholder="2020" min="1990" max="2030" required />
            <Input name="vin" label="VIN / Chasis" placeholder="Número de chasis" />
            <Input name="engine" label="Motor" placeholder="Ej: D13K520" />
            <Input name="color" label="Color" placeholder="Ej: Blanco" />
          </CardContent>
        </Card>

        {/* Estado y KM */}
        <Card>
          <CardHeader><CardTitle>Estado y Kilometraje</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Select name="status" label="Estado">
              <option value="ACTIVE">Activo</option>
              <option value="MAINTENANCE">Mantención</option>
              <option value="INACTIVE">Inactivo</option>
            </Select>
            <Input name="currentKm" label="Kilometraje Actual *" type="number" placeholder="0" min="0" required />
            <Input name="pmInterval" label="Intervalo PM (km)" type="number" placeholder="10000" />
            <Input name="fuelEst" label="Consumo Estimado (km/l)" type="number" step="0.1" placeholder="30" />
            <Input name="tireSize" label="Medida Neumáticos" placeholder="Ej: 295/80 R22.5" />
            <Input name="maxWeight" label="Peso Máximo (ton)" placeholder="Ej: 45" />
          </CardContent>
        </Card>

        {/* Conductor */}
        <Card>
          <CardHeader><CardTitle>Conductor Asignado</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Input name="driverName" label="Nombre del Conductor" placeholder="Nombre completo" />
            <Input name="driverRut" label="RUT Conductor" placeholder="12.345.678-9" />
            <Input name="driverPhone" label="Teléfono" placeholder="+56 9 1234 5678" />
            <Input name="driverLicense" label="N° Licencia" placeholder="Número de licencia" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
          <CardContent>
            <Textarea name="notes" placeholder="Observaciones adicionales del vehículo..." rows={3} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/fleet">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Agregar Camión"}
          </Button>
        </div>
      </form>
    </div>
  );
}
