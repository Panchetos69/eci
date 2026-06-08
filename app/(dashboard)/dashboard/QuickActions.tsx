"use client";
import { useState } from "react";
import { Fuel, Wrench, Truck, Bell, Share2, Check } from "lucide-react";
import Link from "next/link";

interface Props {
  alertCount: number;
}

export default function QuickActions({ alertCount }: Props) {
  const [copied, setCopied] = useState(false);

  function copyRegistroUrl() {
    const url = `${window.location.origin}/registro`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const actions = [
    {
      href: "/fuel/new",
      label: "Registrar combustible",
      icon: <Fuel className="h-6 w-6 text-blue-600" />,
      bg: "bg-blue-50 hover:bg-blue-100",
      border: "border-blue-200",
    },
    {
      href: "/maintenance/new",
      label: "Crear orden de trabajo",
      icon: <Wrench className="h-6 w-6 text-amber-600" />,
      bg: "bg-amber-50 hover:bg-amber-100",
      border: "border-amber-200",
    },
    {
      href: "/fleet/new",
      label: "Agregar camión",
      icon: <Truck className="h-6 w-6 text-green-600" />,
      bg: "bg-green-50 hover:bg-green-100",
      border: "border-green-200",
    },
    {
      href: "/alerts",
      label: "Ver alertas",
      icon: <Bell className="h-6 w-6 text-red-600" />,
      bg: "bg-red-50 hover:bg-red-100",
      border: "border-red-200",
      badge: alertCount > 0 ? alertCount : undefined,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border ${action.bg} ${action.border} transition-colors text-center`}
          >
            {action.badge !== undefined && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {action.badge > 99 ? "99+" : action.badge}
              </span>
            )}
            {action.icon}
            <span className="text-xs font-medium text-slate-700">{action.label}</span>
          </Link>
        ))}
      </div>
      <button
        onClick={copyRegistroUrl}
        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
        {copied ? "¡URL copiada!" : "Compartir formulario conductor (/registro)"}
      </button>
    </div>
  );
}
