/**
 * Tests for auto-incrementing integer IDs (issue #162).
 *
 * These tests use the in-memory `fake-indexeddb` shim so no real browser
 * environment is needed.
 */
import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { DbClient } from "../db-client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh DbClient with a unique appId for each test run. */
let _counter = 0;
function makeClient() {
  return new DbClient({ appId: `test-autoincrement-${_counter++}` });
}

// ---------------------------------------------------------------------------
// UUID strategy (default — existing behaviour must not regress)
// ---------------------------------------------------------------------------

describe("UUID v7 IDs (default)", () => {
  it("assigns a UUID string as _id by default", async () => {
    const db = makeClient();
    const col = db.collection<{ name: string }>("users");
    const { id } = await col.insert({ name: "Alice" });
    expect(typeof id).toBe("string");
    // UUID v7 format: 8-4-4-4-12 hex groups
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("assigns distinct UUIDs to each document", async () => {
    const db = makeClient();
    const col = db.collection<{ x: number }>("items");
    const r1 = await col.insert({ x: 1 });
    const r2 = await col.insert({ x: 2 });
    expect(r1.id).not.toBe(r2.id);
  });
});

// ---------------------------------------------------------------------------
// Auto-increment strategy
// ---------------------------------------------------------------------------

describe("Auto-increment integer IDs", () => {
  let db: DbClient;

  beforeEach(() => {
    db = makeClient();
  });

  it("assigns _id = 1 to the first document", async () => {
    const col = db.collection<{ title: string }>("posts", { idStrategy: "autoincrement" });
    const { id } = await col.insert({ title: "Hello" });
    expect(id).toBe(1);
  });

  it("increments _id sequentially", async () => {
    const col = db.collection<{ v: number }>("nums", { idStrategy: "autoincrement" });
    const r1 = await col.insert({ v: 10 });
    const r2 = await col.insert({ v: 20 });
    const r3 = await col.insert({ v: 30 });
    expect(r1.id).toBe(1);
    expect(r2.id).toBe(2);
    expect(r3.id).toBe(3);
  });

  it("stores the integer _id on the document itself", async () => {
    const col = db.collection<{ name: string }>("things", { idStrategy: "autoincrement" });
    await col.insert({ name: "foo" });
    const [doc] = await col.find();
    expect(doc!._id).toBe(1);
    expect(typeof doc!._id).toBe("number");
  });

  it("insertMany assigns sequential IDs", async () => {
    const col = db.collection<{ n: number }>("batch", { idStrategy: "autoincrement" });
    const results = await col.insertMany([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(results.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("findById works with integer ID", async () => {
    const col = db.collection<{ label: string }>("labels", { idStrategy: "autoincrement" });
    await col.insert({ label: "first" });
    const found = await col.findById(1);
    expect(found).toBeDefined();
    expect(found!.label).toBe("first");
  });

  it("currentSequenceValue returns last assigned ID", async () => {
    const col = db.collection<{ x: number }>("seq", { idStrategy: "autoincrement" });
    expect(await col.currentSequenceValue()).toBe(0);
    await col.insert({ x: 1 });
    expect(await col.currentSequenceValue()).toBe(1);
    await col.insert({ x: 2 });
    expect(await col.currentSequenceValue()).toBe(2);
  });

  it("clearAll resets the sequence back to 0", async () => {
    const col = db.collection<{ x: number }>("resetme", { idStrategy: "autoincrement" });
    await col.insert({ x: 1 });
    await col.insert({ x: 2 });
    await col.clearAll();
    expect(await col.currentSequenceValue()).toBe(0);
    const { id } = await col.insert({ x: 3 });
    expect(id).toBe(1); // starts from 1 again
  });

  it("two collections have independent sequences", async () => {
    const a = db.collection<{ v: number }>("aaa", { idStrategy: "autoincrement" });
    const b = db.collection<{ v: number }>("bbb", { idStrategy: "autoincrement" });
    await a.insert({ v: 1 });
    await a.insert({ v: 2 });
    await b.insert({ v: 99 });
    expect((await a.currentSequenceValue())).toBe(2);
    expect((await b.currentSequenceValue())).toBe(1);
  });

  it("UUID and autoincrement collections on the same DbClient are independent", async () => {
    const uuidCol = db.collection<{ v: number }>("shared");
    const intCol = db.collection<{ v: number }>("shared", { idStrategy: "autoincrement" });
    const uuidResult = await uuidCol.insert({ v: 1 });
    const intResult = await intCol.insert({ v: 2 });
    expect(typeof uuidResult.id).toBe("string");
    expect(intResult.id).toBe(1);
  });

  it("delete by filter still works with integer IDs", async () => {
    const col = db.collection<{ done: boolean }>("tasks", { idStrategy: "autoincrement" });
    await col.insertMany([{ done: true }, { done: false }, { done: true }]);
    const deleted = await col.delete({ done: true });
    expect(deleted).toBe(2);
    expect(await col.count()).toBe(1);
  });

  it("update by filter still works with integer IDs", async () => {
    const col = db.collection<{ status: string }>("jobs", { idStrategy: "autoincrement" });
    await col.insert({ status: "pending" });
    await col.insert({ status: "pending" });
    const updated = await col.update({ status: "pending" }, { $set: { status: "done" } });
    expect(updated).toBe(2);
    const remaining = await col.find({ status: "pending" });
    expect(remaining).toHaveLength(0);
  });

  it("allCollectionNames does not include the internal __zerithdb_seq store", async () => {
    const col = db.collection<{ x: number }>("visible", { idStrategy: "autoincrement" });
    await col.insert({ x: 1 });
    const names = db.allCollectionNames();
    expect(names).not.toContain("__zerithdb_seq");
    expect(names).toContain("visible");
  });
});
