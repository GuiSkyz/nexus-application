import { ReadinessResponse } from "@/types/status";
import { Vehicle } from "@/types/vehicle";
import { ChecklistTemplate } from "@/types/checklist";
import { MockVehicleService } from "@/lib/mockVehicles";
import { MockChecklistService } from "@/lib/mockChecklists";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiClient {
  static async checkReadiness(): Promise<ReadinessResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/ready`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          status: "unready",
          services: data.services || {
            postgres: "unhealthy",
            redis: "unhealthy",
            minio: "unhealthy",
          },
          errorDetail: `Status HTTP ${response.status}: ${data.status || "Serviço Indisponível"}`,
        };
      }

      return data as ReadinessResponse;
    } catch (error) {
      return {
        status: "error",
        services: {
          postgres: "unknown",
          redis: "unknown",
          minio: "unknown",
        },
        errorDetail: error instanceof Error ? error.message : "Falha de comunicação com o backend FastAPI.",
      };
    }
  }

  // ==========================================
  // Frota de Veículos (API FastAPI + Fallback)
  // ==========================================

  static async fetchVehicles(): Promise<Vehicle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        return data as Vehicle[];
      }
    } catch (e) {
      // Fallback gracioso
    }
    return MockVehicleService.getVehicles();
  }

  static async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });
      if (response.ok) {
        return (await response.json()) as Vehicle;
      }
    } catch (e) {
      // Fallback
    }

    return MockVehicleService.saveVehicle({
      model: vehicleData.model || "Novo Veículo",
      plate: vehicleData.plate?.toUpperCase() || "NEW-0000",
      year: vehicleData.year || 2024,
      currentKm: vehicleData.currentKm || 0,
      category: vehicleData.category || "INSTALACAO",
      status: vehicleData.status || "DISPONIVEL",
      assignedTechnicianName: vehicleData.assignedTechnicianName,
      assignedChecklistTitle: vehicleData.assignedChecklistTitle,
    });
  }

  static async batchAssignVehicles(templateId: string, vehicleIds: string[]): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/batch-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, vehicleIds }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.updatedCount;
      }
    } catch (e) {
      // Fallback
    }

    MockVehicleService.batchAssignChecklist(vehicleIds, templateId, `Checklist (${templateId})`);
    return vehicleIds.length;
  }

  // ==========================================
  // Templates de Checklist (API FastAPI + Fallback)
  // ==========================================

  static async fetchChecklists(): Promise<ChecklistTemplate[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/checklists`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        return data as ChecklistTemplate[];
      }
    } catch (e) {
      // Fallback
    }
    return MockChecklistService.getTemplates();
  }

  static async publishChecklist(checklistId: string): Promise<ChecklistTemplate | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/checklists/${checklistId}/publish`, {
        method: "POST",
      });
      if (response.ok) {
        return (await response.json()) as ChecklistTemplate;
      }
    } catch (e) {
      // Fallback
    }

    return MockChecklistService.publishTemplate(checklistId, "Roberto Alcantara", "COORDENADOR");
  }

  static async archiveChecklist(checklistId: string): Promise<ChecklistTemplate | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/checklists/${checklistId}/archive`, {
        method: "POST",
      });
      if (response.ok) {
        return (await response.json()) as ChecklistTemplate;
      }
    } catch (e) {
      // Fallback
    }

    return MockChecklistService.archiveTemplate(checklistId, "Roberto Alcantara", "COORDENADOR");
  }

  static async deleteChecklist(checklistId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/checklists/${checklistId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        return true;
      }
    } catch (e) {
      // Fallback
    }

    try {
      MockChecklistService.deleteTemplate(checklistId, "Roberto Alcantara", "ADMIN");
      return true;
    } catch (e) {
      return false;
    }
  }

  // ==========================================
  // Dashboard
  // ==========================================

  static async fetchDashboardKpis(): Promise<{
    inspections_today: number;
    pending_aprs: number;
    active_vehicles: number;
    incidents_pending: number;
  } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/kpis`, { cache: "no-store" });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Retorna nulo se a API estiver fora
    }
    return null;
  }

  // ==========================================
  // Ações Corretivas (Incidentes)
  // ==========================================

  static async fetchIncidents(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents`, { cache: "no-store" });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Fallback
    }
    return [];
  }

  static async createActionPlan(incidentId: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/action-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Fallback
    }
    return null;
  }

  static async resolveIncident(incidentId: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Fallback
    }
    return null;
  }
}
