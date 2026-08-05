import { AprRecord } from "@/types/apr";
import { AuthUser, LoginResponse } from "@/types/auth";
import { ChecklistTemplate } from "@/types/checklist";
import { StrategicDashboard } from "@/types/dashboard";
import { Incident } from "@/types/incident";
import { OperationalReport } from "@/types/report";
import { OperationalSettings } from "@/types/settings";
import { ReadinessResponse } from "@/types/status";
import { Technician, TechnicianPayload } from "@/types/technician";
import { Vehicle } from "@/types/vehicle";
import { ManagedUser, ManagedUserPayload } from "@/types/user";
import { AuditInspectionDetail, AuditInspectionSummary } from "@/types/audit";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function apiUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ValidationIssue = {
  loc?: unknown;
  msg?: unknown;
};

const fieldLabels: Record<string, string> = {
  email: "E-mail",
  fullName: "Nome completo",
  temporaryPassword: "Senha",
};

function formatValidationIssue(issue: unknown): string | null {
  if (typeof issue === "string") return issue;
  if (!issue || typeof issue !== "object") return null;

  const { loc, msg } = issue as ValidationIssue;
  if (typeof msg !== "string") return null;

  const rawField = Array.isArray(loc)
    ? [...loc].reverse().find((part) => typeof part === "string")
    : undefined;
  const field =
    typeof rawField === "string" ? fieldLabels[rawField] || rawField : null;

  if (field && /should match pattern/i.test(msg)) {
    return `${field}: formato inválido.`;
  }

  const minimum = msg.match(/at least (\d+) characters?/i);
  if (field && minimum) {
    return `${field}: deve ter pelo menos ${minimum[1]} caracteres.`;
  }

  if (field && /field required/i.test(msg)) {
    return `${field}: campo obrigatório.`;
  }

  return field ? `${field}: ${msg}` : msg;
}

export function getApiErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return fallback;
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map(formatValidationIssue)
      .filter((message): message is string => Boolean(message));
    if (messages.length) return messages.join(" ");
  }

  const message = formatValidationIssue(detail);
  return message || fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) {
    let message = `Falha na operação (HTTP ${response.status}).`;
    try {
      const payload: unknown = await response.json();
      message = getApiErrorMessage(payload, message);
    } catch {
      // A resposta não contém JSON.
    }
    const error = new ApiError(message, response.status);
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !path.startsWith("/auth/")
    ) {
      window.dispatchEvent(new Event("nexusops:unauthorized"));
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export class ApiClient {
  static login(email: string, password: string) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  static me() {
    return request<AuthUser>("/auth/me");
  }

  static logout() {
    return request<void>("/auth/logout", { method: "POST" });
  }

  static changePassword(currentPassword: string, newPassword: string) {
    return request<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  static fetchUsers() {
    return request<ManagedUser[]>("/users");
  }

  static saveUser(user: Partial<ManagedUserPayload> & { id?: string }) {
    const { id, ...payload } = user;
    const path = id ? `/users/${id}` : "/users";
    return request<ManagedUser>(path, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
  }

  static deleteUser(id: string) {
    return request<void>(`/users/${id}`, { method: "DELETE" });
  }

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

  static fetchAuditInspections() {
    return request<AuditInspectionSummary[]>("/inspections/audit");
  }

  static fetchAuditInspection(id: string) {
    return request<AuditInspectionDetail>(`/inspections/audit/${id}`);
  }

  static createAuditNonconformity(
    id: string,
    payload: {
      questionId: string;
      description: string;
      severity: string;
      actionPlanDescription: string;
      actionPlanDueDate: string;
    },
  ) {
    return request<{ code: string }>(`/inspections/audit/${id}/nonconformity`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static exportAuditPdf(id: string) {
    return request<{ downloadUrl: string }>(`/inspections/audit/${id}/pdf`, { method: "POST" });
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

  static assignChecklistToTechnicians(
    id: string,
    technicianIds: string[],
  ) {
    return request<ChecklistTemplate>(`/checklists/${id}/assign-technicians`, {
      method: "POST",
      body: JSON.stringify({ technicianIds }),
    });
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

  static saveIncident(incident: object & { id?: string }) {
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

  static reopenIncident(id: string, data: object) {
    return request<Incident>(`/incidents/${id}/reopen`, {
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
