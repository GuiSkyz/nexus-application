export interface ReadinessResponse {
  status: "ready" | "unready" | "loading" | "error";
  services: {
    postgres: "healthy" | "unhealthy" | "unknown";
    redis: "healthy" | "unhealthy" | "unknown";
    minio: "healthy" | "unhealthy" | "unknown";
  };
  errorDetail?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}
