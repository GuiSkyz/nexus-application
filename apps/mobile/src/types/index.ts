export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "ERROR";

export interface SyncQueueItem<T = any> {
  id: string; // UUIDv4 gerado no cliente
  entityType: "INSPECTION" | "VEHICLE_CHECKLIST" | "APR" | "EVIDENCE";
  payload: T;
  createdAt: string; // ISO 8601 UTC timestamp
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
}

export interface ReadinessResponse {
  status: "ready" | "unready" | "loading" | "error";
  services: {
    postgres: "healthy" | "unhealthy" | "unknown";
    redis: "healthy" | "unhealthy" | "unknown";
    minio: "healthy" | "unhealthy" | "unknown";
  };
  errorDetail?: string;
}
