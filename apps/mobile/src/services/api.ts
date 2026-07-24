import { Platform } from "react-native";
import { ReadinessResponse, SyncQueueItem } from "../types";

// No Android emulador, localhost é 10.0.2.2. No navegador web (Expo Web), é localhost.
const defaultBaseUrl =
  Platform.OS === "web"
    ? "http://localhost:8000/api/v1"
    : "http://10.0.2.2:8000/api/v1";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || defaultBaseUrl;

export class ApiService {
  static async getReadinessStatus(): Promise<ReadinessResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/ready`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
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
          errorDetail: `Status HTTP ${response.status}`,
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
        errorDetail: error instanceof Error ? error.message : "Sem conectividade com o backend FastAPI.",
      };
    }
  }

  static async syncBatch(items: SyncQueueItem[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/inspections/sync`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        return true;
      }
    } catch (e) {
      // Falha de rede ou backend offline
    }
    return false;
  }
}
