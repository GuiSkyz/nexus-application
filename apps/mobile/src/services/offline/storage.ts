import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { SyncQueueItem } from "../../types";

const DATABASE_NAME = "nexusops.db";
const SYNC_QUEUE_KEY = "@NexusOps:SyncQueue";
const MIGRATION_KEY = "@NexusOps:SQLiteMigration:v1";
const LOCAL_TEMPLATES_KEY = "@NexusOps:TemplatesCache";

type QueueRow = {
  id: string;
  entity_type: SyncQueueItem["entityType"];
  payload_json: string;
  created_at: string;
  status: SyncQueueItem["status"];
  retry_count: number;
  error_message: string | null;
};

const databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
let initializationPromise: Promise<void> | null = null;

const rowToQueueItem = (row: QueueRow): SyncQueueItem => ({
  id: row.id,
  entityType: row.entity_type,
  payload: JSON.parse(row.payload_json),
  createdAt: row.created_at,
  status: row.status,
  retryCount: row.retry_count,
  errorMessage: row.error_message ?? undefined,
});

async function initializeDatabase(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const database = await databasePromise;
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS sync_outbox (
        id TEXT PRIMARY KEY NOT NULL,
        entity_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        retry_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sync_outbox_status_created
      ON sync_outbox(status, created_at);
    `);

    await database.runAsync(
      `UPDATE sync_outbox SET status = 'PENDING', updated_at = ? WHERE status = 'SYNCING'`,
      new Date().toISOString()
    );

    if (await AsyncStorage.getItem(MIGRATION_KEY)) return;
    const legacyJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (legacyJson) {
      const legacyItems = JSON.parse(legacyJson) as SyncQueueItem[];
      await database.withTransactionAsync(async () => {
        for (const item of legacyItems) {
          await database.runAsync(
            `INSERT OR IGNORE INTO sync_outbox
             (id, entity_type, payload_json, created_at, status, retry_count, error_message, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            item.id,
            item.entityType,
            JSON.stringify(item.payload),
            item.createdAt,
            item.status === "SYNCING" ? "PENDING" : item.status,
            item.retryCount,
            item.errorMessage ?? null,
            new Date().toISOString()
          );
        }
      });
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    }
    await AsyncStorage.setItem(MIGRATION_KEY, "completed");
  })();

  return initializationPromise;
}

export class OfflineStorage {
  static generateClientUUID(): string {
    return Crypto.randomUUID();
  }

  static async enqueueSyncItem(
    entityType: SyncQueueItem["entityType"],
    payload: unknown
  ): Promise<SyncQueueItem> {
    await initializeDatabase();
    const database = await databasePromise;
    const now = new Date().toISOString();
    const item: SyncQueueItem = {
      id: this.generateClientUUID(),
      entityType,
      payload,
      createdAt: now,
      status: "PENDING",
      retryCount: 0,
    };

    await database.runAsync(
      `INSERT INTO sync_outbox
       (id, entity_type, payload_json, created_at, status, retry_count, error_message, updated_at)
       VALUES (?, ?, ?, ?, 'PENDING', 0, NULL, ?)`,
      item.id,
      item.entityType,
      JSON.stringify(item.payload),
      item.createdAt,
      now
    );
    return item;
  }

  static async getSyncQueue(): Promise<SyncQueueItem[]> {
    await initializeDatabase();
    const database = await databasePromise;
    const rows = await database.getAllAsync<QueueRow>(
      `SELECT id, entity_type, payload_json, created_at, status, retry_count, error_message
       FROM sync_outbox ORDER BY created_at ASC`
    );
    return rows.map(rowToQueueItem);
  }

  static async updateSyncItemStatus(
    id: string,
    status: SyncQueueItem["status"],
    errorMessage?: string
  ): Promise<void> {
    await initializeDatabase();
    const database = await databasePromise;
    await database.runAsync(
      `UPDATE sync_outbox
       SET status = ?,
           retry_count = retry_count + CASE WHEN ? = 'ERROR' THEN 1 ELSE 0 END,
           error_message = ?,
           updated_at = ?
       WHERE id = ?`,
      status,
      status,
      errorMessage ?? null,
      new Date().toISOString(),
      id
    );
  }

  static async removeSyncedItems(): Promise<void> {
    await initializeDatabase();
    const database = await databasePromise;
    await database.runAsync("DELETE FROM sync_outbox WHERE status = 'SYNCED'");
  }

  static async cacheTemplates(templates: unknown[]): Promise<void> {
    await AsyncStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
  }
}
