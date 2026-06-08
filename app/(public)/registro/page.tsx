"use client";
import { useState, useEffect } from "react";

interface Truck {
  id: string;
  plate: string;
  internalId: string;
  brand: string;
  model: string;
  fleetType: "INDUSTRIAL" | "PARTICULAR";
  currentKm: number;
  currentHours: number;
}

export default function RegistroPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/fuel")
      .then((r) => r.json())
      .then((d) => setTrucks(d.trucks || []));
  }, []);

  const totalCost =
    liters && price
      ? (parseFloat(liters) * parseFloat(price)).toLocaleString("es-CL")
      : "—";

  function handleTruckChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const t = trucks.find((t) => t.id === e.target.value) || null;
    setSelectedTruck(t);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    const res = await fetch("/api/public/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        truckId: data.truckId,
        date: data.date,
        liters: data.liters,
        pricePerLiter: data.pricePerLiter,
        kmAtLoad: data.kmAtLoad || undefined,
        engineHours: data.engineHours || undefined,
        driverName: data.driverName || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Error al registrar carga");
    } else {
      const result = await res.json();
      setSuccess({ ...result, liters: data.liters, pricePerLiter: data.pricePerLiter, totalCost });
      setTimeout(() => {
        setSuccess(null);
        setLiters("");
        setPrice("");
        setSelectedTruck(null);
        (e.target as HTMLFormElement).reset();
      }, 3000);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">¡Registrado!</h2>
          <p className="text-slate-600 mb-4">
            Carga registrada para <strong>{success.truck?.plate}</strong>
          </p>
          <div className="bg-green-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Litros</span>
              <span className="font-semibold">{parseFloat(success.liters).toLocaleString("es-CL")} L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Precio/Litro</span>
              <span className="font-semibold">${parseFloat(success.pricePerLiter).toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between border-t border-green-200 pt-2">
              <span className="text-slate-600 font-medium">Total</span>
              <span className="font-bold text-green-700">${success.totalCost}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">Redirigiendo en 3 segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-8 px-4">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xl shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m-12 0l4 4m-4-4l4-4" />
          </svg>
          FleetIQ Chile
        </div>
        <p className="text-slate-500 text-sm mt-2">Registro de combustible para conductores</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-5">Registrar Carga de Combustible</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Truck selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Camión *</label>
            <select
              name="truckId"
              required
              onChange={handleTruckChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona tu camión...</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plate} — {t.internalId} ({t.brand} {t.model})
                </option>
              ))}
            </select>
            {selectedTruck && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                Tipo: {selectedTruck.fleetType === "INDUSTRIAL" ? "Industrial (horas motor)" : "Particular (kilometraje)"}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fecha y Hora *</label>
            <input
              name="date"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Liters + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Litros *</label>
              <input
                name="liters"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                required
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Precio/Litro *</label>
              <input
                name="pricePerLiter"
                type="number"
                step="1"
                min="0"
                placeholder="1100"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Total cost */}
          {liters && price && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Total</span>
              <span className="text-xl font-bold text-blue-800">$ {totalCost}</span>
            </div>
          )}

          {/* KM or Hours depending on fleet type */}
          {selectedTruck?.fleetType === "PARTICULAR" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kilometraje al Cargar *</label>
              <input
                name="kmAtLoad"
                type="number"
                min="0"
                placeholder="0"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {selectedTruck?.fleetType === "INDUSTRIAL" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Horas Motor *</label>
              <input
                name="engineHours"
                type="number"
                step="0.1"
                min="0"
                placeholder={selectedTruck.currentHours > 0 ? selectedTruck.currentHours.toString() : "0"}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* If no truck selected, show generic KM field */}
          {!selectedTruck && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kilometraje / Horas Motor</label>
              <input
                name="kmAtLoad"
                type="number"
                min="0"
                placeholder="KM o Horas"
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Driver name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre del Conductor</label>
            <input
              name="driverName"
              type="text"
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ubicación / Grifo (opcional)</label>
            <input
              name="location"
              type="text"
              placeholder="Ej: COPEC Ruta 5 Norte"
              className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notas (opcional)</label>
            <textarea
              name="notes"
              placeholder="Observaciones adicionales..."
              rows={2}
              className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-lg py-4 rounded-xl transition-colors mt-2"
          >
            {loading ? "Registrando..." : "Registrar Carga"}
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-400 mt-6">FleetIQ Chile — Sistema de gestión de flota</p>
    </div>
  );
}
