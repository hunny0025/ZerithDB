import { Dexie, type Table } from "dexie";
import { EventEmitter } from "zerithdb-core";
import { getQueueDb, type QueueTableName } from "./queue-db.js";
import type { QueueChange, QueuedMutation, QueuedMutationDirection } from "./types.js";

export type QueueEnqueueInput<TPayload> = {
  type: string;
  collection: string;
  payload: TPayload;
};

type QueueEvents<TPayload> = {
  change: QueueChange<TPayload>;
};

export abstract class BaseQueue<TPayload = unknown> {
  protected readonly table: Table<QueuedMutation<TPayload>, string>;
  private readonly events = new EventEmitter<QueueEvents<TPayload>>();
  protected readonly direction: QueuedMutationDirection;

  constructor(appId: string, tableName: QueueTableName, direction: QueuedMutationDirection) {
    this.direction = direction;
    const db = getQueueDb(appId);
    this.table = db.table(tableName) as Table<QueuedMutation<TPayload>, string>;
  }

  onChange(callback: (change: QueueChange<TPayload>) => void): () => void {
    this.events.on("change", callback);
    return () => this.events.off("change", callback);
  }

  async enqueue(input: QueueEnqueueInput<TPayload>): Promise<QueuedMutation<TPayload>> {
    const mutation: QueuedMutation<TPayload> = {
      id: generateId(),
      type: input.type,
      collection: input.collection,
      payload: input.payload,
      timestamp: Date.now(),
      status: "pending",
      retries: 0,
      direction: this.direction,
    };

    await this.table.add(mutation);
    this.events.emit("change", { action: "enqueue", mutation });
    return mutation;
  }

  async getPending(): Promise<QueuedMutation<TPayload>[]> {
    return this.table.where("status").equals("pending").sortBy("timestamp");
  }

  async acknowledge(id: string): Promise<QueuedMutation<TPayload> | null> {
    const existing = await this.table.get(id);
    if (!existing) return null;

    const mutation = { ...existing, status: "acknowledged" as const };
    await this.table.delete(id);
    this.events.emit("change", { action: "acknowledge", mutation });
    return mutation;
  }

  async markFailed(id: string): Promise<QueuedMutation<TPayload> | null> {
    const existing = await this.table.get(id);
    if (!existing) return null;

    const mutation = {
      ...existing,
      status: "failed" as const,
      retries: existing.retries + 1,
    };
    await this.table.put(mutation);
    this.events.emit("change", { action: "failed", mutation });
    return mutation;
  }

  async count(): Promise<number> {
    return this.table.where("status").equals("pending").count();
  }
}

function generateId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
