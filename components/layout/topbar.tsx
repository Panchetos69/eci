"use client";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user: { name?: string | null; email?: string | null; role?: string; orgName?: string };
  alertCount: number;
}

export function Topbar({ user, alertCount }: TopbarProps) {
  const [open, setOpen] = useState(false);

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    MECHANIC: "Mecánico",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 z-10">
      {/* Org name */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800 hidden sm:block">{user.orgName || "FleetIQ Chile"}</p>
      </div>

      {/* Alert bell */}
      <Link href="/alerts" className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
        <Bell className="h-5 w-5 text-slate-600" />
        {alertCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5 leading-none">
            {alertCount > 99 ? "99+" : alertCount}
          </span>
        )}
      </Link>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-800 leading-tight">{user.name}</p>
            <p className="text-xs text-slate-500">{roleLabel[user.role || ""] || user.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="h-4 w-4" />
                Mi perfil
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
