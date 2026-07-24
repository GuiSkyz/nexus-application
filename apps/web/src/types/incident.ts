export type IncidentSeverity = "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";

export type IncidentStatus =
  | "ABERTA"
  | "EM_ANALISE"
  | "PLANO_DE_ACAO"
  | "RESOLVIDA"
  | "CANCELADA";

export interface ActionPlan {
  id: string;
  incidentId: string;
  description: string;
  assignedTo: string; // Ex: "Oficina Credenciada / Manutenção Frota"
  dueDate: string;
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  evidencePhotoUrl?: string;
}

export interface Incident {
  id: string; // Ex: "NC-2026-089"
  inspectionId?: string;
  inspectionTitle: string;
  contextType: "VEHICLE" | "INDIVIDUAL" | "ACTIVITY" | "APR";
  vehiclePlate?: string;
  vehicleModel?: string;
  technicianName: string;
  teamName: string;
  questionText: string;
  category: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string;
  description?: string;
  actionPlan?: ActionPlan;
}

export interface IncidentKPIs {
  totalOpen: number;
  criticalCount: number;
  inActionPlan: number;
  resolvedThisMonth: number;
}
