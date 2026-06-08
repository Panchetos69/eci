"use client";
import { useState } from "react";

interface Props {
  orgId: string;
  initialTelegramChatId: string;
  initialWhatsappNumber: string;
}

export default function NotificationSettings({ orgId, initialTelegramChatId, initialWhatsappNumber }: Props) {
  const [telegramChatId, setTelegramChatId] = useState(initialTelegramChatId);
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsappNumber);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramChatId, whatsappNumber }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Configuración guardada correctamente" });
    } else {
      setMessage({ type: "error", text: "Error al guardar configuración" });
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    const res = await fetch(`/api/organizations/${orgId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test-notifications" }),
    });
    setTesting(false);
    const data = await res.json();
    if (res.ok) {
      const channels = Object.entries(data.results || {})
        .map(([k, v]) => `${k}: ${v ? "✓" : "✗"}`)
        .join(", ");
      setMessage({ type: "success", text: `Prueba enviada. ${channels || "Sin canales configurados"}` });
    } else {
      setMessage({ type: "error", text: data.error || "Error al enviar prueba" });
    }
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          message.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      {/* Telegram */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Telegram Chat ID</label>
        <input
          type="text"
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value)}
          placeholder="Ej: -1001234567890"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-2 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Cómo configurar Telegram:</p>
          <p>1. Agrega <span className="font-mono bg-white px-1 rounded border">@FleetIQBot</span> a tu grupo de Telegram</p>
          <p>2. Envía <span className="font-mono bg-white px-1 rounded border">/start</span> en el grupo</p>
          <p>3. Pega aquí el Chat ID que te entrega el bot</p>
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">WhatsApp (número con código de país)</label>
        <input
          type="text"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="Ej: +56912345678"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500 mt-1">Requiere cuenta Twilio configurada en el servidor</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
        <button
          onClick={handleTest}
          disabled={testing || (!telegramChatId && !whatsappNumber)}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 transition-colors"
        >
          {testing ? "Enviando..." : "Enviar mensaje de prueba"}
        </button>
      </div>
    </div>
  );
}
