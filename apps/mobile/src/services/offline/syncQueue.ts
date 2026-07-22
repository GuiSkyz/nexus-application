import { OfflineStorage } from "./storage";
import { SyncQueueItem } from "../../types";

export class SyncOrchestrator {
  private static isSyncing = false;

  /**
   * Tenta sincronizar os itens pendentes ou em erro na fila local com o backend FastAPI.
   * Respeita a máquina de estados (PENDING -> SYNCING -> SYNCED/ERROR).
   */
  static async triggerSyncWorker(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const queue = await OfflineStorage.getSyncQueue();
      const pendingItems = queue.filter(
        (item) => item.status === "PENDING" || (item.status === "ERROR" && item.retryCount < 5)
      );

      for (const item of pendingItems) {
        await OfflineStorage.updateSyncItemStatus(item.id, "SYNCING");
        
        try {
          // Na próxima iteração (Módulos de Negócio), faremos o POST via ApiService
          // Simulação de transação transacional bem sucedida:
          await OfflineStorage.updateSyncItemStatus(item.id, "SYNCED");
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Falha ao sincronizar com servidor";
          await OfflineStorage.updateSyncItemStatus(item.id, "ERROR", msg);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
}
