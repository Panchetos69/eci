export type Role = "ADMIN" | "SUPERVISOR" | "MECHANIC";
export type Plan = "STARTER" | "GROWTH" | "PROFESSIONAL" | "ENTERPRISE";
export type TruckStatus = "ACTIVE" | "MAINTENANCE" | "ALERT" | "CRITICAL" | "INACTIVE";
export type DocType = "SOAP" | "RVT" | "PERMISO_CIRCULACION" | "SEGURO_RC" | "TAG" | "OTRO";
export type WOType = "PREVENTIVO" | "CORRECTIVO" | "EMERGENCIA" | "REVISION";
export type WOStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type AlertType = "PM_DUE" | "DOCUMENT_EXPIRY" | "LOW_STOCK" | "HIGH_FUEL" | "FAULT_REPORTED" | "SYSTEM";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type FaultSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FaultStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type MoveType = "IN" | "OUT" | "ADJUSTMENT";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgId: string;
  orgName: string;
}
