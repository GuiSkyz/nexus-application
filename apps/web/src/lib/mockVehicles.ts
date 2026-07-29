import { Vehicle } from "@/types/vehicle";

let mockVehiclesStore: Vehicle[] = [
  {
    id: "veh-101",
    model: "Fiat Strada Endurance 1.4",
    plate: "ABC-1234",
    year: 2024,
    currentKm: 34500,
    category: "INSTALACAO",
    status: "DISPONIVEL",
    assignedTechnicianName: "Carlos Silva",
    assignedTechnicianRole: "Técnico de Instalação - Equipe Alfa",
    assignedChecklistTemplateId: "tpl-101-v1",
    assignedChecklistTitle: "Vistoria de Saída — Veículos da Frota (v1.0)",
    lastInspectionDate: "2026-07-22T08:00:00Z",
    lastInspectionStatus: "CONFORME",
  },
  {
    id: "veh-102",
    model: "VW Delivery 9.170 (Escada Telescópica)",
    plate: "XYZ-9876",
    year: 2023,
    currentKm: 78200,
    category: "MANUTENCAO_FIBRA",
    status: "DISPONIVEL",
    assignedTechnicianName: "Carlos Silva",
    assignedTechnicianRole: "Técnico de Manutenção de Fibra",
    assignedChecklistTemplateId: "tpl-102-v1",
    assignedChecklistTitle: "Segurança para Trabalho em Altura & NR-35 (v1.0)",
    lastInspectionDate: "2026-07-21T10:30:00Z",
    lastInspectionStatus: "CONFORME",
  },
  {
    id: "veh-103",
    model: "Renault Kangoo 1.6 Express",
    plate: "KKK-5544",
    year: 2022,
    currentKm: 92100,
    category: "INSTALACAO",
    status: "EM_VISTORIA",
    assignedTechnicianName: "Marcos Oliveira",
    assignedTechnicianRole: "Técnico Instalador - Equipe Beta",
    assignedChecklistTemplateId: "tpl-101-v1",
    assignedChecklistTitle: "Vistoria de Saída — Veículos da Frota (v1.0)",
    lastInspectionDate: "2026-07-23T07:15:00Z",
    lastInspectionStatus: "PENDENTE",
  },
  {
    id: "veh-104",
    model: "Nissan Frontier 4x4 (Geradores & Torres)",
    plate: "INF-2026",
    year: 2025,
    currentKm: 14800,
    category: "INFRAESTRUTURA",
    status: "DISPONIVEL",
    assignedTechnicianName: "Juliana Lima",
    assignedTechnicianRole: "Supervisora de Infraestrutura",
    assignedChecklistTemplateId: "tpl-102-v1",
    assignedChecklistTitle: "Segurança para Trabalho em Altura & NR-35 (v1.0)",
    lastInspectionDate: "2026-07-20T09:00:00Z",
    lastInspectionStatus: "CONFORME",
  },
];

export class MockVehicleService {
  static getVehicles(): Vehicle[] {
    return [...mockVehiclesStore];
  }

  static getVehicleById(id: string): Vehicle | undefined {
    return mockVehiclesStore.find((v) => v.id === id);
  }

  static saveVehicle(vehicleData: Partial<Vehicle>): Vehicle {
    const existingIndex = mockVehiclesStore.findIndex((v) => v.id === vehicleData.id);

    if (existingIndex >= 0) {
      const updated = { ...mockVehiclesStore[existingIndex], ...vehicleData };
      mockVehiclesStore[existingIndex] = updated;
      return updated;
    } else {
      const newVehicle: Vehicle = {
        id: `veh-${Date.now()}`,
        model: vehicleData.model || "Novo Veículo",
        plate: (vehicleData.plate || "AAA-0000").toUpperCase(),
        year: vehicleData.year || new Date().getFullYear(),
        currentKm: vehicleData.currentKm || 0,
        category: vehicleData.category || "INSTALACAO",
        status: vehicleData.status || "DISPONIVEL",
        assignedTechnicianName: vehicleData.assignedTechnicianName,
        assignedTechnicianRole: vehicleData.assignedTechnicianRole,
        assignedChecklistTemplateId: vehicleData.assignedChecklistTemplateId,
        assignedChecklistTitle: vehicleData.assignedChecklistTitle,
        lastInspectionStatus: "PENDENTE",
      };
      mockVehiclesStore.push(newVehicle);
      return newVehicle;
    }
  }

  /**
   * ATRIBUIÇÃO E REPLICAÇÃO EM LOTE:
   * Vincula O MESMO template de checklist a MÚLTIPLOS veículos sem duplicação de dados,
   * evitando qualquer retrabalho da equipe de coordenação.
   */
  static batchAssignChecklist(
    vehicleIds: string[],
    templateId: string,
    templateTitle: string,
    technicianName?: string
  ): void {
    mockVehiclesStore = mockVehiclesStore.map((veh) => {
      if (vehicleIds.includes(veh.id)) {
        return {
          ...veh,
          assignedChecklistTemplateId: templateId,
          assignedChecklistTitle: templateTitle,
          ...(technicianName ? { assignedTechnicianName: technicianName } : {}),
        };
      }
      return veh;
    });
  }

  static deleteVehicle(id: string): void {
    mockVehiclesStore = mockVehiclesStore.filter((v) => v.id !== id);
  }
}
