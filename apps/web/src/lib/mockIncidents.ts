import { Incident, ActionPlan, IncidentKPIs } from "@/types/incident";

let mockIncidentsStore: Incident[] = [
  {
    id: "NC-2026-089",
    inspectionId: "insp-101",
    inspectionTitle: "Vistoria Diária de Saída — Veículos da Frota",
    contextType: "VEHICLE",
    vehiclePlate: "ABC1D23",
    vehicleModel: "Fiat Strada Endurance (Caminhonete 12)",
    technicianName: "João Souza",
    teamName: "Equipe Alfa - Instalação",
    category: "Segurança Mecânica",
    questionText: "Calibragem e estado dos 4 pneus e estepe da Caminhonete 12 estão adequados?",
    severity: "CRITICA",
    status: "PLANO_DE_ACAO",
    reportedAt: "2026-07-23T07:45:00Z",
    description: "Pneu dianteiro esquerdo apresentando desgaste excessivo na banda de rodagem (careca). Risco de estouro.",
    actionPlan: {
      id: "ap-101",
      incidentId: "NC-2026-089",
      description: "Encaminhar Caminhonete 12 à oficina credenciada AutoCenter para substituição de 2 pneus dianteiros e alinhamento.",
      assignedTo: "Manutenção da Frota / AutoCenter",
      dueDate: "2026-07-24T18:00:00Z",
      createdAt: "2026-07-23T09:30:00Z",
      createdBy: "Roberto Alcantara (Coordenador)",
    },
  },
  {
    id: "NC-2026-085",
    inspectionId: "insp-98",
    inspectionTitle: "Inspeção de Segurança em Altura (NR-35)",
    contextType: "ACTIVITY",
    technicianName: "Marcos Oliveira",
    teamName: "Equipe Beta - Infraestrutura",
    category: "Equipamentos NR-35",
    questionText: "Escada de fibra isolada acoplada ao rack sem trincas nos degraus?",
    severity: "ALTA",
    status: "ABERTA",
    reportedAt: "2026-07-22T14:15:00Z",
    description: "Degrau #4 com fissura visível na resina de fibra. Equipamento interditado preventivamente.",
  },
  {
    id: "NC-2026-072",
    inspectionId: "insp-80",
    inspectionTitle: "Checklist Individual de EPI & Uniforme",
    contextType: "INDIVIDUAL",
    technicianName: "Carlos Silva",
    teamName: "Equipe Gama",
    category: "EPIs Individuais",
    questionText: "Capacete de proteção com jugular e óculos de proteção em bom estado?",
    severity: "MEDIA",
    status: "RESOLVIDA",
    reportedAt: "2026-07-20T08:10:00Z",
    description: "Jugular do capacete com fecho plástico quebrado.",
    actionPlan: {
      id: "ap-080",
      incidentId: "NC-2026-072",
      description: "Substituição imediata por kit de jugular novo no almoxarifado central.",
      assignedTo: "Almoxarifado / SSO",
      dueDate: "2026-07-20T12:00:00Z",
      createdAt: "2026-07-20T08:30:00Z",
      createdBy: "Juliana Lima (Supervisor)",
      resolvedAt: "2026-07-20T10:45:00Z",
      resolutionNotes: "Jugular substituída e testada. Capacete liberado para uso.",
    },
  },
];

export class MockIncidentService {
  static getIncidents(): Incident[] {
    return [...mockIncidentsStore];
  }

  static getIncidentById(id: string): Incident | undefined {
    return mockIncidentsStore.find((i) => i.id === id);
  }

  static getKPIs(): IncidentKPIs {
    const totalOpen = mockIncidentsStore.filter(
      (i) => i.status === "ABERTA" || i.status === "EM_ANALISE" || i.status === "PLANO_DE_ACAO"
    ).length;

    const criticalCount = mockIncidentsStore.filter(
      (i) => i.severity === "CRITICA" && i.status !== "RESOLVIDA"
    ).length;

    const inActionPlan = mockIncidentsStore.filter((i) => i.status === "PLANO_DE_ACAO").length;

    const resolvedThisMonth = mockIncidentsStore.filter((i) => i.status === "RESOLVIDA").length;

    return { totalOpen, criticalCount, inActionPlan, resolvedThisMonth };
  }

  static addActionPlan(
    incidentId: string,
    description: string,
    assignedTo: string,
    dueDate: string,
    createdBy: string
  ): Incident {
    const incident = mockIncidentsStore.find((i) => i.id === incidentId);
    if (!incident) throw new Error("Não conformidade não encontrada.");

    const newPlan: ActionPlan = {
      id: `ap-${Date.now()}`,
      incidentId,
      description,
      assignedTo,
      dueDate,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    incident.actionPlan = newPlan;
    incident.status = "PLANO_DE_ACAO";
    return { ...incident };
  }

  static resolveIncident(incidentId: string, resolutionNotes: string): Incident {
    const incident = mockIncidentsStore.find((i) => i.id === incidentId);
    if (!incident) throw new Error("Não conformidade não encontrada.");

    incident.status = "RESOLVIDA";
    if (incident.actionPlan) {
      incident.actionPlan.resolvedAt = new Date().toISOString();
      incident.actionPlan.resolutionNotes = resolutionNotes;
    }
    return { ...incident };
  }
}
