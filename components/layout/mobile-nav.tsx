"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Truck, Wrench, Bell, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  role: string;
  alertCount: number;
}

export function MobileNav({ role, alertCount }: MobileNavProps) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/fleet", label: "Flota", icon: Truck },
    { href: "/maintenance", label: "Mantención", icon: Wrench },
    { href: "/fuel", label: "Combustible", icon: Fuel },
    { href: "/alerts", label: "Alertas", icon: Bell, badge: alertCount },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors relative",
              active ? "text-blue-600" : "text-slate-500"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-slate-500")} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full h-3.5 min-w-[14px] flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
            {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-blue-600 rounded-b-full" />}
          </Link>
        );
      })}
    </nav>
  );
}
