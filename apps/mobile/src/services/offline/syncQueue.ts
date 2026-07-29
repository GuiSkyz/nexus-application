import { OfflineStorage } from "./storage";
import { ApiService } from "../api";

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

      if (pendingItems.length === 0) return;

      // Marcar como SYNCING
      for (const item of pendingItems) {
        await OfflineStorage.updateSyncItemStatus(item.id, "SYNCING");
      }

      // Envio em lote para a API FastAPI real (/api/v1/inspections/sync)
      const success = await ApiService.syncBatch(pendingItems);

      for (const item of pendingItems) {
        if (success) {
          // Atualização com status SYNCED
          await OfflineStorage.updateSyncItemStatus(item.id, "SYNCED");
        } else {
          // Em caso de desconexão, simulação offline inteligente (marca como SYNCED no simulador)
          await OfflineStorage.updateSyncItemStatus(
            item.id,
            "ERROR",
            "Sem conexão com o servidor. O envio será tentado novamente."
          );
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
}
