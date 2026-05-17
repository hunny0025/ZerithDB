import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { OutboxQueue } from "./OutboxQueue.js";
import { InboxQueue } from "./InboxQueue.js";

const createAppId = () => `test-queue-${Math.random().toString(36).slice(2)}`;

describe("OutboxQueue", () => {
  it("enqueue should persist and count pending", async () => {
    const appId = createAppId();
    const queue = new OutboxQueue<Uint8Array>(appId);

    await queue.enqueue({
      type: "sync-update",
      collection: "todos",
      payload: new Uint8Array([1, 2, 3]),
    });

    expect(await queue.count()).toBe(1);
    const pending = await queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.collection).toBe("todos");
    expect(pending[0]?.payload).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("acknowledge should remove from pending", async () => {
    const appId = createAppId();
    const queue = new OutboxQueue<Uint8Array>(appId);

    const mutation = await queue.enqueue({
      type: "sync-update",
      collection: "notes",
      payload: new Uint8Array([9]),
    });

    await queue.acknowledge(mutation.id);

    expect(await queue.count()).toBe(0);
    const pending = await queue.getPending();
    expect(pending).toHaveLength(0);
  });

  it("markFailed should increment retries and clear pending", async () => {
    const appId = createAppId();
    const queue = new OutboxQueue<string>(appId);

    const mutation = await queue.enqueue({
      type: "sync-update",
      collection: "logs",
      payload: "payload",
    });

    const failed = await queue.markFailed(mutation.id);

    expect(failed?.status).toBe("failed");
    expect(failed?.retries).toBe(1);
    expect(await queue.count()).toBe(0);
  });

  it("should persist across instances", async () => {
    const appId = createAppId();
    const queueA = new OutboxQueue<number>(appId);

    await queueA.enqueue({
      type: "sync-update",
      collection: "items",
      payload: 42,
    });

    const queueB = new OutboxQueue<number>(appId);
    const pending = await queueB.getPending();

    expect(pending).toHaveLength(1);
    expect(pending[0]?.payload).toBe(42);
  });
});

describe("InboxQueue", () => {
  it("enqueue should persist and count pending", async () => {
    const appId = createAppId();
    const queue = new InboxQueue<Uint8Array>(appId);

    await queue.enqueue({
      type: "sync-update",
      collection: "todos",
      payload: new Uint8Array([4, 5, 6]),
    });

    expect(await queue.count()).toBe(1);
    const pending = await queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.collection).toBe("todos");
  });

  it("acknowledge should remove from pending", async () => {
    const appId = createAppId();
    const queue = new InboxQueue<Uint8Array>(appId);

    const mutation = await queue.enqueue({
      type: "sync-update",
      collection: "notes",
      payload: new Uint8Array([8]),
    });

    await queue.acknowledge(mutation.id);

    expect(await queue.count()).toBe(0);
    const pending = await queue.getPending();
    expect(pending).toHaveLength(0);
  });

  it("markFailed should increment retries and clear pending", async () => {
    const appId = createAppId();
    const queue = new InboxQueue<string>(appId);

    const mutation = await queue.enqueue({
      type: "sync-update",
      collection: "logs",
      payload: "payload",
    });

    const failed = await queue.markFailed(mutation.id);

    expect(failed?.status).toBe("failed");
    expect(failed?.retries).toBe(1);
    expect(await queue.count()).toBe(0);
  });

  it("should persist across instances", async () => {
    const appId = createAppId();
    const queueA = new InboxQueue<number>(appId);

    await queueA.enqueue({
      type: "sync-update",
      collection: "items",
      payload: 7,
    });

    const queueB = new InboxQueue<number>(appId);
    const pending = await queueB.getPending();

    expect(pending).toHaveLength(1);
    expect(pending[0]?.payload).toBe(7);
  });
});
