"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Fuel,
  Bell,
  Package,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fleet", label: "Flota", icon: Truck },
  { href: "/maintenance", label: "Mantención", icon: Wrench },
  { href: "/fuel", label: "Combustible", icon: Fuel },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/inventory", label: "Inventario", icon: Package },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
];

interface SidebarProps {
  role: string;
  alertCount: number;
}

export function Sidebar({ role, alertCount }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#1a2540] text-white flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">FleetIQ</p>
          <p className="text-xs text-blue-300">Chile</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Principal
        </p>
        {visibleItems.slice(0, 5).map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
            badge={item.href === "/alerts" ? alertCount : undefined}
          />
        ))}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-4">
          Gestión
        </p>
        {visibleItems.slice(5).map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-slate-500">FleetIQ Chile v1.0</p>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
        active
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-white")} />
      <span className="flex-1">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && <ChevronRight className="h-4 w-4 opacity-50" />}
    </Link>
  );
}
