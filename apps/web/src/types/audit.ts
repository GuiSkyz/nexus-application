export interface AuditInspectionSummary {
  id: string;
  title: string;
  technicianName: string;
  vehiclePlate?: string;
  completedAt: string;
  answerCount: number;
  evidenceCount: number;
}

export interface AuditInspectionDetail extends AuditInspectionSummary {
  notes?: string;
  answers: Array<{ questionId: string; questionText: string; answerValue: string }>;
  evidences: Array<{ id: string; photoUrl: string; capturedAt: string; description?: string }>;
}
