"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  truckId: string;
  plate: string;
}

export default function DeleteTruckButton({ truckId, plate }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/trucks/${truckId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push("/fleet");
    } else {
      const data = await res.json();
      setError(data.error || "Error al eliminar camión");
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <span className="text-xs text-slate-600">¿Eliminar {plate}?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? "Eliminando..." : "Confirmar"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Eliminar
    </button>
  );
}
