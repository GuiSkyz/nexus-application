import { Platform } from "react-native";

import {
  MobileContext,
  MobileUser,
  Incident,
  ReadinessResponse,
  SyncQueueItem,
} from "../types";
import { SessionService } from "./session";

const localBaseUrl =
  Platform.OS === "web"
    ? "http://localhost:8000/api/v1"
    : "http://10.0.2.2:8000/api/v1";

// Atualizações OTA não herdam as variáveis de ambiente de perfis de build.
// Em uma versão instalada, nunca devemos usar o host reservado ao emulador.
const defaultBaseUrl = __DEV__
  ? localBaseUrl
  : "https://app.gsfmcloud.tech/api/v1";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || defaultBaseUrl;

type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: MobileUser;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const token = authenticated ? await SessionService.getToken() : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Falha de comunicação (${response.status}).`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Mantém a mensagem HTTP quando a resposta não é JSON.
    }
    if (response.status === 401) await SessionService.clear();
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export class ApiService {
  static async login(email: string, password: string): Promise<MobileUser> {
    const response = await request<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          client: "mobile",
        }),
      },
      false,
    );
    await SessionService.setToken(response.access_token);
    return response.user;
  }

  static async restoreSession(): Promise<MobileUser | null> {
    const token = await SessionService.getToken();
    if (!token) return null;
    try {
      return await request<MobileUser>("/auth/me");
    } catch {
      return null;
    }
  }

  static async hasStoredSession(): Promise<boolean> {
    return Boolean(await SessionService.getToken());
  }

  static async logout(): Promise<void> {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } finally {
      await SessionService.clear();
    }
  }

  static getMobileContext(): Promise<MobileContext> {
    return request<MobileContext>("/inspections/mobile-context");
  }

  static getMyIncidents(): Promise<Incident[]> {
    return request<Incident[]>("/incidents");
  }

  static submitIncidentForReview(id: string, resolutionNotes: string, evidenceDataUrl: string): Promise<Incident> {
    return request<Incident>(`/incidents/${id}/submit-review`, {
      method: "POST",
      body: JSON.stringify({ resolutionNotes, evidenceDataUrl }),
    });
  }

  static async getReadinessStatus(): Promise<ReadinessResponse> {
    try {
      return await request<ReadinessResponse>("/health/ready", {}, false);
    } catch (error) {
      return {
        status: "error",
        services: {
          postgres: "unknown",
          redis: "unknown",
          minio: "unknown",
        },
        errorDetail:
          error instanceof Error
            ? error.message
            : "Sem conectividade com o backend.",
      };
    }
  }

  static async syncBatch(items: SyncQueueItem[]): Promise<Set<string>> {
    const response = await request<{
      syncedCount: number;
      results: Array<{ id: string; status: string; message: string }>;
    }>("/inspections/sync", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
    return new Set(
      response.results
        .filter((item) => item.status === "SYNCED")
        .map((item) => item.id),
    );
  }
}
