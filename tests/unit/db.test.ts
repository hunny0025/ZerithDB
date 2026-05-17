import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { DbClient } from "../../packages/db/src/db-client.js";
import type { ZerithDBConfig } from "../../packages/core/src/index.js";
import { ZerithDBError, ErrorCode } from "../../packages/core/src/index.js";

describe("DbClient — CollectionClient", () => {
  let db: DbClient;
  let currentAppId: string;

  beforeEach(() => {
    currentAppId = "test-db-" + Math.random().toString(36).slice(2);
    db = new DbClient({ appId: currentAppId });
  });

  afterEach(async () => {
    await db.dispose();
    const req = indexedDB.deleteDatabase(`zerithdb_${currentAppId}`);
    await new Promise<void>((resolve) => {
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  describe("insert()", () => {
    it("should return a generated _id", async () => {
      const col = db.collection<{ text: string }>("todos");
      const result = await col.insert({ text: "hello" });
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBeGreaterThan(0);
    });

    it("should persist the document so find() returns it", async () => {
      const col = db.collection<{ text: string }>("todos");
      const { id } = await col.insert({ text: "world" });
      const docs = await col.find({});
      expect(docs).toHaveLength(1);
      expect(docs[0]?._id).toBe(id);
      expect(docs[0]?.text).toBe("world");
    });

    it("should add _createdAt and _updatedAt timestamps", async () => {
      const before = Date.now();
      const col = db.collection<{ x: number }>("items");
      await col.insert({ x: 42 });
      const after = Date.now();
      const [doc] = await col.find({});
      expect(doc?._createdAt).toBeGreaterThanOrEqual(before);
      expect(doc?._createdAt).toBeLessThanOrEqual(after);
      expect(doc?._updatedAt).toBeDefined();
    });
  });

  describe("insertMany()", () => {
    it("should insert multiple documents", async () => {
      const col = db.collection<{ n: number }>("nums");
      const results = await col.insertMany([{ n: 1 }, { n: 2 }, { n: 3 }]);
      expect(results).toHaveLength(3);
      const docs = await col.find({});
      expect(docs).toHaveLength(3);
    });
  });

  describe("find()", () => {
    it("should return all documents with empty filter", async () => {
      const col = db.collection<{ v: number }>("vals");
      await col.insertMany([{ v: 1 }, { v: 2 }, { v: 3 }]);
      const docs = await col.find({});
      expect(docs).toHaveLength(3);
    });

    it("should filter by exact equality", async () => {
      const col = db.collection<{ done: boolean }>("tasks");
      await col.insertMany([{ done: true }, { done: false }, { done: true }]);
      const done = await col.find({ done: true });
      expect(done).toHaveLength(2);
    });

    it("should support $gt operator", async () => {
      const col = db.collection<{ score: number }>("scores");
      await col.insertMany([{ score: 10 }, { score: 50 }, { score: 90 }]);
      const high = await col.find({ score: { $gt: 30 } });
      expect(high).toHaveLength(2);
    });

    it("should support $in operator", async () => {
      const col = db.collection<{ status: string }>("items");
      await col.insertMany([{ status: "open" }, { status: "closed" }, { status: "pending" }]);
      const active = await col.find({ status: { $in: ["open", "pending"] } });
      expect(active).toHaveLength(2);
    });

    it("should return empty array when no documents match", async () => {
      const col = db.collection<{ x: number }>("empty");
      await col.insert({ x: 1 });
      const result = await col.find({ x: { $gt: 100 } });
      expect(result).toHaveLength(0);
    });
  });

  describe("findById()", () => {
    it("should return the document with matching _id", async () => {
      const col = db.collection<{ name: string }>("people");
      const { id } = await col.insert({ name: "Alice" });
      const doc = await col.findById(id);
      expect(doc?.name).toBe("Alice");
    });

    it("should return undefined for unknown _id", async () => {
      const col = db.collection<{ name: string }>("people");
      const doc = await col.findById("nonexistent-id");
      expect(doc).toBeUndefined();
    });
  });

  describe("update()", () => {
    it("should update matching documents", async () => {
      const col = db.collection<{ done: boolean; text: string }>("todos");
      await col.insert({ text: "fix bug", done: false });
      const count = await col.update({ done: false }, { $set: { done: true } });
      expect(count).toBe(1);
      const docs = await col.find({ done: true });
      expect(docs).toHaveLength(1);
    });

    it("should update _updatedAt on update", async () => {
      const col = db.collection<{ v: number }>("vals");
      const { id } = await col.insert({ v: 1 });
      const before = (await col.findById(id))?._updatedAt ?? 0;
      await new Promise((r) => setTimeout(r, 5));
      await col.update({ _id: id } as never, { $set: { v: 2 } });
      const after = (await col.findById(id))?._updatedAt ?? 0;
      expect(after).toBeGreaterThanOrEqual(before);
    });

    it("should unset matching document fields", async () => {
      const col = db.collection<{ text: string; note?: string }>("todos");
      const { id } = await col.insert({ text: "fix bug", note: "remove me" });

      const count = await col.update({ text: "fix bug" }, { $unset: { note: true } });

      const doc = await col.findById(id);
      expect(count).toBe(1);
      expect(doc).toBeDefined();
      expect(doc).not.toHaveProperty("note");
      expect(doc?.text).toBe("fix bug");
    });
  });

  describe("delete()", () => {
    it("should remove matching documents", async () => {
      const col = db.collection<{ done: boolean }>("tasks");
      await col.insertMany([{ done: true }, { done: false }]);
      const count = await col.delete({ done: true });
      expect(count).toBe(1);
      const remaining = await col.find({});
      expect(remaining).toHaveLength(1);
    });
  });

  describe("clearAll()", () => {
    it("should remove every document in the collection", async () => {
      const col = db.collection<{ done: boolean }>("tasks");
      await col.insertMany([{ done: true }, { done: false }, { done: true }]);

      await col.clearAll();

      expect(await col.find({})).toHaveLength(0);
      expect(await col.count()).toBe(0);
    });

    it("should not clear other collections", async () => {
      const tasks = db.collection<{ done: boolean }>("tasks");
      await tasks.insertMany([{ done: true }, { done: false }]);

      // Use a separate client instance for the second collection to avoid
      // internal Dexie state conflicts during dynamic schema upgrades
      const db2 = new DbClient({ appId: currentAppId });
      const notes = db2.collection<{ text: string }>("notes");
      await notes.insert({ text: "keep me" });

      await tasks.clearAll();

      expect(await tasks.count()).toBe(0);
      expect(await notes.count()).toBe(1);

      await db2.dispose();
    });
  });

  describe("count()", () => {
    it("should return correct document count", async () => {
      const col = db.collection<{ x: number }>("counts");
      await col.insertMany([{ x: 1 }, { x: 2 }, { x: 3 }]);
      expect(await col.count()).toBe(3);
      expect(await col.count({ x: { $gt: 1 } })).toBe(2);
    });
  });
});

// ─── Input Validation Guards (issue #552) ────────────────────────────────────

describe("DbClient — input validation guards", () => {
  let db: DbClient;

  beforeEach(() => {
    db = new DbClient({
      appId: "test-validation-" + Math.random().toString(36).slice(2),
    });
  });

  afterEach(async () => {
    await db.dispose();
  });

  // ── DbClient.collection() ────────────────────────────────────────────────

  describe("collection()", () => {
    it("should throw DB_INIT_FAILED for an empty string name", () => {
      expect(() => db.collection("")).toThrow(ZerithDBError);
      expect(() => db.collection("")).toThrow(
        expect.objectContaining({ code: ErrorCode.DB_INIT_FAILED })
      );
    });

    it("should throw DB_INIT_FAILED for a whitespace-only name", () => {
      expect(() => db.collection("   ")).toThrow(ZerithDBError);
      expect(() => db.collection("   ")).toThrow(
        expect.objectContaining({ code: ErrorCode.DB_INIT_FAILED })
      );
    });

    it("should throw DB_INIT_FAILED for a non-string name", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => db.collection(null as any)).toThrow(ZerithDBError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => db.collection(42 as any)).toThrow(
        expect.objectContaining({ code: ErrorCode.DB_INIT_FAILED })
      );
    });

    it("should NOT throw for a valid name", () => {
      expect(() => db.collection("todos")).not.toThrow();
    });
  });

  // ── CollectionClient.insert() ────────────────────────────────────────────

  describe("insert()", () => {
    it("should throw DB_WRITE_FAILED when document is null", async () => {
      const col = db.collection<{ text: string }>("guard-insert");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.insert(null as any)).rejects.toThrow(ZerithDBError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.insert(null as any)).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should throw DB_WRITE_FAILED when document is undefined", async () => {
      const col = db.collection<{ text: string }>("guard-insert");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.insert(undefined as any)).rejects.toThrow(ZerithDBError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.insert(undefined as any)).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should NOT throw for a valid document", async () => {
      const col = db.collection<{ text: string }>("guard-insert");
      await expect(col.insert({ text: "ok" })).resolves.toBeDefined();
    });
  });

  // ── CollectionClient.insertMany() ───────────────────────────────────────

  describe("insertMany()", () => {
    it("should throw DB_WRITE_FAILED for an empty array", async () => {
      const col = db.collection<{ n: number }>("guard-insert-many");
      await expect(col.insertMany([])).rejects.toThrow(ZerithDBError);
      await expect(col.insertMany([])).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should throw DB_WRITE_FAILED when array contains null", async () => {
      const col = db.collection<{ n: number }>("guard-insert-many");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.insertMany([{ n: 1 }, null as any])).rejects.toThrow(ZerithDBError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.insertMany([{ n: 1 }, null as any])).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should throw DB_WRITE_FAILED when array contains undefined", async () => {
      const col = db.collection<{ n: number }>("guard-insert-many");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.insertMany([undefined as any, { n: 2 }])).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should NOT throw for a valid non-empty array", async () => {
      const col = db.collection<{ n: number }>("guard-insert-many");
      await expect(col.insertMany([{ n: 1 }, { n: 2 }])).resolves.toHaveLength(2);
    });
  });

  // ── CollectionClient.update() ────────────────────────────────────────────

  describe("update()", () => {
    it("should throw DB_WRITE_FAILED when spec is null", async () => {
      const col = db.collection<{ v: number }>("guard-update");
      await col.insert({ v: 1 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.update({}, null as any)).rejects.toThrow(ZerithDBError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.update({}, null as any)).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should throw DB_WRITE_FAILED when spec is undefined", async () => {
      const col = db.collection<{ v: number }>("guard-update");
      await col.insert({ v: 1 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(col.update({}, undefined as any)).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should throw DB_WRITE_FAILED when spec is an empty object", async () => {
      const col = db.collection<{ v: number }>("guard-update");
      await col.insert({ v: 1 });
      await expect(col.update({}, {})).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should throw DB_WRITE_FAILED when $set and $unset are both empty objects", async () => {
      const col = db.collection<{ v: number }>("guard-update");
      await col.insert({ v: 1 });
      await expect(col.update({}, { $set: {}, $unset: {} })).rejects.toMatchObject({
        code: ErrorCode.DB_WRITE_FAILED,
      });
    });

    it("should NOT throw for a valid spec with $set", async () => {
      const col = db.collection<{ v: number }>("guard-update");
      await col.insert({ v: 1 });
      await expect(col.update({ v: 1 }, { $set: { v: 2 } })).resolves.toBe(1);
    });
  });
});
