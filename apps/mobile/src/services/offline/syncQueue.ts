import { ApiService } from "../api";
import { OfflineStorage } from "./storage";

export class SyncOrchestrator {
  private static isSyncing = false;

  static async triggerSyncWorker(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const queue = await OfflineStorage.getSyncQueue();
      const pendingItems = queue.filter(
        (item) =>
          item.status === "PENDING" ||
          (item.status === "ERROR" && item.retryCount < 5),
      );
      if (pendingItems.length === 0) return;

      for (const item of pendingItems) {
        await OfflineStorage.updateSyncItemStatus(item.id, "SYNCING");
      }

      const syncedIds = await ApiService.syncBatch(pendingItems);
      for (const item of pendingItems) {
        if (syncedIds.has(item.id)) {
          await OfflineStorage.updateSyncItemStatus(item.id, "SYNCED");
        } else {
          await OfflineStorage.updateSyncItemStatus(
            item.id,
            "ERROR",
            "O servidor não confirmou este registro.",
          );
        }
      }
    } catch (error) {
      const queue = await OfflineStorage.getSyncQueue();
      const syncingItems = queue.filter((item) => item.status === "SYNCING");
      const message =
        error instanceof Error
          ? error.message
          : "Sem conexão com o servidor. O envio será tentado novamente.";
      for (const item of syncingItems) {
        await OfflineStorage.updateSyncItemStatus(item.id, "ERROR", message);
      }
    } finally {
      this.isSyncing = false;
    }
  }
}
