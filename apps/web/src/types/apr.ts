export type AprStatus =
  | "DRAFT"
  | "PENDING_AUTHORIZATION"
  | "AUTHORIZED"
  | "REJECTED"
  | "CANCELLED";

export type RiskLevel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";

export interface Signature {
  signerName: string;
  signedAt: string;
  strokes: Array<Array<{ x: number; y: number }>>;
}

export interface AprRisk {
  hazard: string;
  probability: number;
  severity: number;
  score: number;
  level: RiskLevel;
  controls: string[];
  residualProbability: number;
  residualSeverity: number;
  residualScore: number;
  residualLevel: RiskLevel;
}

export interface AprRecord {
  id: string;
  clientGeneratedId: string;
  serviceOrderNumber: string;
  activityId: string;
  activityType: string;
  location: string;
  technicianId: string;
  technicianName: string;
  teamName: string;
  plannedStart: string;
  requiredPpe: string[];
  weatherConditions: string;
  emergencyContact: string;
  risks: AprRisk[];
  maximumRiskLevel: RiskLevel;
  maximumResidualRiskLevel: RiskLevel;
  status: AprStatus;
  canStartActivity: boolean;
  technicianSignature: Signature;
  supervisorSignature?: Signature;
  authorizedBy?: string;
  authorizedAt?: string;
  authorizationNotes?: string;
}
