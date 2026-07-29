export interface OperationalReport {
  period: { start: string | null; end: string | null };
  overall: {
    inspections: number;
    complianceRate: number;
    nonconformities: number;
    criticalNonconformities: number;
    resolutionRate: number;
  };
  teams: ReportGroup[];
  fleet: ReportGroup[];
}

export interface ReportGroup {
  name: string;
  inspections: number;
  checklistItems: number;
  conformingItems: number;
  nonconformities: number;
  criticalNonconformities: number;
  resolvedNonconformities: number;
  complianceRate: number;
}
