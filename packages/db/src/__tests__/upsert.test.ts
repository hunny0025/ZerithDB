import "fake-indexeddb/auto";

import { describe, it, expect } from "vitest";
import { DbClient } from "zerithdb-db";

describe("upsert", () => {
  it("inserts a new document if it does not exist", async () => {
    const db = new DbClient({
      appId: "upsert-insert-test",
    });

    const users = db.collection<{ name: string }>("users");

    const result = await users.upsert({
      name: "John",
    });

    const doc = await users.findById(result.id);

    expect(doc).toBeDefined();
    expect(doc?.name).toBe("John");
    expect(doc?._id).toBe(result.id);
  });

  it("updates an existing document", async () => {
    const db = new DbClient({
      appId: "upsert-update-test",
    });

    const users = db.collection<{ name: string; age?: number }>("users");

    const inserted = await users.insert({
      name: "John",
    });

    await users.upsert({
      _id: inserted.id,
      name: "Jane",
      age: 20,
    });

    const updated = await users.findById(inserted.id);

    expect(updated?.name).toBe("Jane");
    expect(updated?.age).toBe(20);
  });

  it("preserves _createdAt when updating", async () => {
    const db = new DbClient({
      appId: "upsert-created-at-test",
    });

    const users = db.collection<{ name: string }>("users");

    const inserted = await users.insert({
      name: "John",
    });

    const before = await users.findById(inserted.id);

    await users.upsert({
      _id: inserted.id,
      name: "Jane",
    });

    const after = await users.findById(inserted.id);

    expect(after?._createdAt).toBe(before?._createdAt);
    expect(after?._updatedAt).toBeGreaterThanOrEqual(before!._updatedAt);
  });
  it("generates a new _id when _id is null", async () => {
    const db = new DbClient({
      appId: "upsert-null-id-test",
    });

    const users = db.collection<{ name: string }>("users");

    const result = await users.upsert({
      _id: null as any,
      name: "John",
    });

    const doc = await users.findById(result.id);

    expect(result.id).toBeDefined();
    expect(doc).toBeDefined();
    expect(doc?.name).toBe("John");
  });

  it("generates a new _id when _id is undefined", async () => {
    const db = new DbClient({
      appId: "upsert-undefined-id-test",
    });

    const users = db.collection<{ name: string }>("users");

    const result = await users.upsert({
      _id: undefined,
      name: "Jane",
    });

    const doc = await users.findById(result.id);

    expect(result.id).toBeDefined();
    expect(doc).toBeDefined();
    expect(doc?.name).toBe("Jane");
  });

  it("throws when upserting null", async () => {
    const db = new DbClient({
      appId: "upsert-null-doc-test",
    });

    const users = db.collection<{ name: string }>("users");

    await expect(users.upsert(null as any)).rejects.toThrow("Document cannot be null or undefined");
  });

  it("throws when upserting a non-object value", async () => {
    const db = new DbClient({
      appId: "upsert-invalid-doc-test",
    });

    const users = db.collection<{ name: string }>("users");

    await expect(users.upsert("invalid" as any)).rejects.toThrow("Document must be a valid object");
  });

  it("throws when upserting an array", async () => {
    const db = new DbClient({
      appId: "upsert-array-doc-test",
    });

    const users = db.collection<{ name: string }>("users");

    await expect(users.upsert([] as any)).rejects.toThrow("Document must be a valid object");
  });
});
