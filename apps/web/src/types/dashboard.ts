export interface StrategicDashboard {
  generatedAt: string;
  overview: {
    inspectionsToday: number;
    inspectionsPeriod: number;
    complianceRate: number;
    pendingAprs: number;
    openIncidents: number;
    criticalIncidents: number;
    overdueActions: number;
    resolutionRate: number;
    activeVehicles: number;
    unavailableVehicles: number;
    activeTechnicians: number;
  };
  attention: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    owner: string;
    team: string;
    reportedAt: string;
  }>;
  activity: Array<{ date: string; inspections: number }>;
}
