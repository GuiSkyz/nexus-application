import { ReadinessResponse } from "../types";

// No Android emulador, localhost é 10.0.2.2 ou IP da LAN para dispositivos reais.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api/v1";

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
}
