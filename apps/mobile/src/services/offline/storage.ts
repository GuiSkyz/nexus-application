import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { SyncQueueItem } from "../../types";

const SYNC_QUEUE_KEY = "@NexusOps:SyncQueue";
const LOCAL_TEMPLATES_KEY = "@NexusOps:TemplatesCache";

export class OfflineStorage {
  /**
   * Gera UUIDv4 antecipadamente no cliente para conciliação no backend e imutabilidade de ID.
   */
  static generateClientUUID(): string {
    return uuidv4();
  }

  /**
   * Armazena um novo item na fila local de sincronização (status: PENDING).
   */
  static async enqueueSyncItem(entityType: SyncQueueItem["entityType"], payload: any): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: this.generateClientUUID(),
      entityType,
      payload,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      retryCount: 0,
    };

    const currentQueue = await this.getSyncQueue();
    currentQueue.push(item);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(currentQueue));
    return item;
  }

  /**
   * Retorna todos os itens na fila local de sincronização.
   */
  static async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Atualiza o status e contagem de tentativas de um item da fila.
   */
  static async updateSyncItemStatus(id: string, status: SyncQueueItem["status"], errorMessage?: string): Promise<void> {
    const currentQueue = await this.getSyncQueue();
    const updated = currentQueue.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status,
          retryCount: status === "ERROR" ? item.retryCount + 1 : item.retryCount,
          errorMessage,
        };
      }
      return item;
    });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  }

  /**
   * Cache de templates baixados para operação offline.
   */
  static async cacheTemplates(templates: any[]): Promise<void> {
    await AsyncStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
  }
}
