import { AprRecord } from "@/types/apr";
import { ChecklistTemplate } from "@/types/checklist";
import { StrategicDashboard } from "@/types/dashboard";
import { Incident } from "@/types/incident";
import { OperationalReport } from "@/types/report";
import { OperationalSettings } from "@/types/settings";
import { ReadinessResponse } from "@/types/status";
import { Technician, TechnicianPayload } from "@/types/technician";
import { Vehicle } from "@/types/vehicle";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    let message = `Falha na operação (HTTP ${response.status}).`;
    try {
      const payload = await response.json();
      message = payload.detail || message;
    } catch {
      // A resposta não contém JSON.
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export class ApiClient {
  static checkReadiness() {
    return request<ReadinessResponse>("/health/ready");
  }

  static fetchStrategicDashboard() {
    return request<StrategicDashboard>("/dashboard/strategic");
  }

  static fetchVehicles() {
    return request<Vehicle[]>("/vehicles");
  }

  static saveVehicle(vehicle: Partial<Vehicle>) {
    const path = vehicle.id ? `/vehicles/${vehicle.id}` : "/vehicles";
    return request<Vehicle>(path, {
      method: vehicle.id ? "PUT" : "POST",
      body: JSON.stringify(vehicle),
    });
  }

  static deleteVehicle(id: string) {
    return request<void>(`/vehicles/${id}`, { method: "DELETE" });
  }

  static async batchAssignVehicles(templateId: string, vehicleIds: string[]) {
    const result = await request<{ updatedCount: number }>("/vehicles/batch-assign", {
      method: "POST",
      body: JSON.stringify({ templateId, vehicleIds }),
    });
    return result.updatedCount;
  }

  static fetchChecklists() {
    return request<ChecklistTemplate[]>("/checklists");
  }

  static fetchChecklist(id: string) {
    return request<ChecklistTemplate>(`/checklists/${id}`);
  }

  static saveChecklist(template: Partial<ChecklistTemplate>) {
    const path = template.id ? `/checklists/${template.id}` : "/checklists";
    return request<ChecklistTemplate>(path, {
      method: template.id ? "PUT" : "POST",
      body: JSON.stringify(template),
    });
  }

  static publishChecklist(id: string) {
    return request<ChecklistTemplate>(`/checklists/${id}/publish`, { method: "POST" });
  }

  static archiveChecklist(id: string) {
    return request<ChecklistTemplate>(`/checklists/${id}/archive`, { method: "POST" });
  }

  static duplicateChecklist(id: string) {
    return request<ChecklistTemplate>(`/checklists/${id}/duplicate`, { method: "POST" });
  }

  static deleteChecklist(id: string) {
    return request<void>(`/checklists/${id}`, { method: "DELETE" });
  }

  static fetchIncidents() {
    return request<Incident[]>("/incidents");
  }

  static saveIncident(incident: Partial<Incident>) {
    const path = incident.id ? `/incidents/${incident.id}` : "/incidents";
    return request<Incident>(path, {
      method: incident.id ? "PUT" : "POST",
      body: JSON.stringify(incident),
    });
  }

  static deleteIncident(id: string) {
    return request<void>(`/incidents/${id}`, { method: "DELETE" });
  }

  static createActionPlan(id: string, data: object) {
    return request<Incident>(`/incidents/${id}/action-plan`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static resolveIncident(id: string, data: object) {
    return request<Incident>(`/incidents/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static fetchTechnicians() {
    return request<Technician[]>("/technicians");
  }

  static saveTechnician(technician: Partial<TechnicianPayload> & { id?: string }) {
    const path = technician.id ? `/technicians/${technician.id}` : "/technicians";
    return request<Technician>(path, {
      method: technician.id ? "PUT" : "POST",
      body: JSON.stringify(technician),
    });
  }

  static deleteTechnician(id: string) {
    return request<void>(`/technicians/${id}`, { method: "DELETE" });
  }

  static fetchAprs() {
    return request<AprRecord[]>("/apr");
  }

  static decideApr(
    id: string,
    decision: "authorize" | "reject",
    supervisorName: string,
    notes: string,
  ) {
    const signedAt = new Date().toISOString();
    return request<AprRecord>(`/apr/${id}/${decision}`, {
      method: "POST",
      body: JSON.stringify({
        supervisorId: "web-supervisor",
        supervisorName,
        notes,
        signature: {
          signerName: supervisorName,
          signedAt,
          strokes: [[{ x: 0, y: 0 }, { x: 1, y: 1 }]],
        },
      }),
    });
  }

  static deleteApr(id: string) {
    return request<void>(`/apr/${id}`, { method: "DELETE" });
  }

  static fetchOperationalReport(startDate: string, endDate: string) {
    const query = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    return request<OperationalReport>(`/reports/operational?${query}`);
  }

  static fetchSettings() {
    return request<OperationalSettings>("/settings");
  }

  static saveSettings(settings: Omit<OperationalSettings, "id" | "updatedAt">) {
    return request<OperationalSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }
}
