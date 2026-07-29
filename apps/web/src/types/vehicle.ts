export type VehicleCategory =
  | "INSTALACAO"
  | "MANUTENCAO_FIBRA"
  | "INFRAESTRUTURA"
  | "SUPERVISAO";

export type VehicleStatus =
  | "DISPONIVEL"
  | "EM_VISTORIA"
  | "MANUTENCAO"
  | "INDISPONIVEL";

export interface Vehicle {
  id: string; // Ex: "veh-101"
  model: string; // Ex: "Fiat Strada Endurance 1.4"
  plate: string; // Ex: "ABC-1234"
  year: number;
  currentKm: number;
  category: VehicleCategory;
  status: VehicleStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string; // Ex: "Carlos Silva"
  assignedTechnicianRole?: string; // Ex: "Técnico de Instalação - Equipe Alfa"
  assignedChecklistTemplateId?: string; // ID do template vinculado (ex: "tpl-101-v1")
  assignedChecklistTitle?: string; // Título legível do checklist vinculado
  lastInspectionDate?: string; // ISO date
  lastInspectionStatus?: "CONFORME" | "NAO_CONFORME" | "PENDENTE";
}
