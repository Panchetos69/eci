import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "orange" | "gray";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-blue-100 text-blue-800": variant === "default",
          "bg-green-100 text-green-800": variant === "success",
          "bg-amber-100 text-amber-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "danger",
          "bg-sky-100 text-sky-800": variant === "info",
          "bg-orange-100 text-orange-800": variant === "orange",
          "bg-slate-100 text-slate-600": variant === "gray",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    ACTIVE: { label: "Activo", variant: "success" },
    MAINTENANCE: { label: "Mantención", variant: "warning" },
    ALERT: { label: "Alerta", variant: "orange" },
    CRITICAL: { label: "Crítico", variant: "danger" },
    INACTIVE: { label: "Inactivo", variant: "gray" },
    PENDING: { label: "Pendiente", variant: "gray" },
    IN_PROGRESS: { label: "En proceso", variant: "info" },
    COMPLETED: { label: "Completado", variant: "success" },
    CANCELLED: { label: "Cancelado", variant: "danger" },
  };
  const cfg = map[status] || { label: status, variant: "default" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function priorityBadge(priority: string) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    CRITICAL: { label: "Crítica", variant: "danger" },
    HIGH: { label: "Alta", variant: "orange" },
    NORMAL: { label: "Normal", variant: "default" },
    LOW: { label: "Baja", variant: "gray" },
  };
  const cfg = map[priority] || { label: priority, variant: "default" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
