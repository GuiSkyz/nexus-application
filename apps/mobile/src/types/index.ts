export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "ERROR";

export interface SyncQueueItem<T = any> {
  id: string; // UUIDv4 gerado no cliente
  entityType: "INSPECTION" | "VEHICLE_CHECKLIST" | "APR" | "EVIDENCE";
  payload: T;
  createdAt: string; // ISO 8601 UTC timestamp
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
}

export interface ReadinessResponse {
  status: "ready" | "unready" | "loading" | "error";
  services: {
    postgres: "healthy" | "unhealthy" | "unknown";
    redis: "healthy" | "unhealthy" | "unknown";
    minio: "healthy" | "unhealthy" | "unknown";
  };
  errorDetail?: string;
}

// ==========================================
// Módulo de Contextos da Experiência Mobile
// ==========================================

export type ChecklistContextType = "VEHICLE" | "INDIVIDUAL" | "ACTIVITY" | "APR";

export type ChecklistExecutionState =
  | "NO_VEHICLE_ASSIGNED"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "LOCKED"
  | "OFFLINE_PENDING"
  | "NO_INTERNET"
  | "SYNCED"
  | "SYNC_ERROR";

export interface VehicleShiftAssignment {
  technicianId: string;
  technicianName: string;
  vehicleId: string;
  model: string;
  plate: string;
  fleetNumber: string; // Ex: "Caminhonete 12"
  teamId: string;
  teamName: string; // Ex: "Equipe Alfa - Instalação"
  date: string;
  shift: string; // Ex: "Turno Manhã (07:30 - 16:30)"
  isResponsible: boolean; // Apenas o responsável pelo veículo conclui o checklist do carro
  participants: string[]; // Nomes dos outros técnicos na mesma equipe/veículo
  lastInspectionDate?: string;
  pendingIssuesCount: number;
}

export interface ActivityContext {
  activityId: string;
  serviceOrderNumber: string; // Ex: "OS-8849"
  title: string; // Ex: "Instalação FTTH - Edifício Horizon"
  activityType: "INSTALACAO" | "MANUTENCAO_FIBRA" | "TRABALHO_ALTURA" | "INFRAESTRUTURA";
  riskLevel: "ALTO" | "MEDIO" | "BAIXO";
  scheduledTime: string;
  address: string;
}

export type ChecklistAnswerValue = "CONFORME" | "NAO_CONFORME" | "NA";

export interface ChecklistQuestion {
  id: string;
  category: string;
  questionText: string;
  isRequired: boolean;
}

export interface EvidencePhoto {
  id: string;
  photoUri: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  description: string;
}

export interface SignaturePoint {
  x: number;
  y: number;
}

export interface SignatureStroke {
  points: SignaturePoint[];
}

export interface DigitalSignature {
  signerName: string;
  signedAt: string;
  strokes: SignatureStroke[];
  dataUrl: string;
}

export interface ContextualChecklist {
  id: string;
  templateId: string;
  templateVersion: number;
  title: string;
  category: string;
  contextType: ChecklistContextType;
  vehicleId?: string;
  technicianId?: string;
  activityId?: string;
  teamId?: string;
  isRequired: boolean;
  state: ChecklistExecutionState;
  estimatedMinutes: number;
  questions: ChecklistQuestion[];
  answers: Record<string, ChecklistAnswerValue>;
  evidences: EvidencePhoto[];
  notes?: string;
}

export interface Inspection {
  id: string;
  title: string;
  type: "VEHICLE_OUT" | "HEIGHT_WORK";
  vehiclePlate?: string;
  vehicleModel?: string;
  technicianName: string;
  scheduledDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  questions: ChecklistQuestion[];
  answers: Record<string, ChecklistAnswerValue>;
  evidences: EvidencePhoto[];
  notes?: string;
  signature?: DigitalSignature;
}

export type MobileTabName = "HOME" | "MY_TASKS" | "ALL_CHECKLISTS" | "HISTORY" | "PROFILE";
