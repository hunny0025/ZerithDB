import Dexie, { type Table } from "dexie";
import type { QueuedMutation } from "./types.js";

const QUEUE_DB_PREFIX = "zerithdb_queue_";
const OUTBOX_TABLE = "_zerith_outbox";
const INBOX_TABLE = "_zerith_inbox";

export type QueueTableName = typeof OUTBOX_TABLE | typeof INBOX_TABLE;

class QueueDexie extends Dexie {
  outbox!: Table<QueuedMutation, string>;
  inbox!: Table<QueuedMutation, string>;

  constructor(appId: string) {
    super(`${QUEUE_DB_PREFIX}${appId}`);
    this.version(1).stores({
      [OUTBOX_TABLE]: "id, status, timestamp, collection, type, direction",
      [INBOX_TABLE]: "id, status, timestamp, collection, type, direction",
    });
    this.outbox = this.table(OUTBOX_TABLE);
    this.inbox = this.table(INBOX_TABLE);
  }
}

const dbCache = new Map<string, QueueDexie>();

export function getQueueDb(appId: string): QueueDexie {
  let db = dbCache.get(appId);
  if (!db) {
    db = new QueueDexie(appId);
    dbCache.set(appId, db);
  }
  return db;
}

export const queueTableNames = {
  outbox: OUTBOX_TABLE,
  inbox: INBOX_TABLE,
} as const;
