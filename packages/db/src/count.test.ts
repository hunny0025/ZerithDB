import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { DbClient } from "./db-client.js";

function createDb() {
  return new DbClient({ appId: "count-test-db" + Math.random().toString(36).slice(2) });
}

describe("Collection count()", () => {
  let db: ReturnType<typeof createDb>;

  beforeEach(async () => {
    db = createDb();

    const todos = db.collection("todos");

    await todos.insert({ title: "A", done: false });
    await todos.insert({ title: "B", done: true });
    await todos.insert({ title: "C", done: false });
  });

  it("counts all documents", async () => {
    const todos = db.collection("todos");

    const total = await todos.count();

    expect(total).toBe(3);
  });

  it("counts filtered documents", async () => {
    const todos = db.collection("todos");

    const completed = await todos.count({ done: true });

    expect(completed).toBe(1);
  });

  it("returns zero when no documents match", async () => {
    const todos = db.collection("todos");

    const result = await todos.count({ done: "invalid" as never });

    expect(result).toBe(0);
  });
});
