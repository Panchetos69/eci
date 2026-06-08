import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function fmtDate(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

export function fmtDatetime(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function fmtRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function daysUntil(date: Date | string): number {
  return differenceInDays(new Date(date), new Date());
}

export function docTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SOAP: "SOAP",
    RVT: "Revisión Técnica",
    PERMISO_CIRCULACION: "Permiso Circulación",
    SEGURO_RC: "Seguro RC",
    TAG: "TAG",
    OTRO: "Otro",
  };
  return labels[type] || type;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Activo",
    MAINTENANCE: "Mantención",
    ALERT: "Alerta",
    CRITICAL: "Crítico",
    INACTIVE: "Inactivo",
    PENDING: "Pendiente",
    IN_PROGRESS: "En proceso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };
  return labels[status] || status;
}

export function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: "Baja",
    NORMAL: "Normal",
    HIGH: "Alta",
    CRITICAL: "Crítica",
  };
  return labels[priority] || priority;
}

export function woTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PREVENTIVO: "Preventivo",
    CORRECTIVO: "Correctivo",
    EMERGENCIA: "Emergencia",
    REVISION: "Revisión",
  };
  return labels[type] || type;
}
