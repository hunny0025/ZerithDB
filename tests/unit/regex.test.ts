import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { DbClient } from "../../packages/db/src/db-client.js";

describe("CollectionClient — $regex operator", () => {
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

  it("should match documents using a native RegExp pattern", async () => {
    const col = db.collection<{ title: string }>("tasks");
    await col.insertMany([
      { title: "finish the report" },
      { title: "buy milk" },
      { title: "urgent: fix bug" },
    ]);

    const results = await col.find({ title: { $regex: /urgent/ } });
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("urgent: fix bug");
  });

  it("should match documents using a string pattern", async () => {
    const col = db.collection<{ title: string }>("tasks");
    await col.insertMany([
      { title: "urgent: fix bug" },
      { title: "buy milk" },
      { title: "finish the urgent chore" },
    ]);

    const results = await col.find({ title: { $regex: "urgent" } });
    expect(results).toHaveLength(2);
  });

  it("should respect RegExp flags like /i for case-insensitive matching", async () => {
    const col = db.collection<{ title: string }>("tasks");
    await col.insertMany([
      { title: "URGENT priority" },
      { title: "urgent priority" },
      { title: "regular task" },
    ]);

    const results = await col.find({ title: { $regex: /urgent/i } });
    expect(results).toHaveLength(2);
  });

  it("should return false (exclude documents) for non-string fields", async () => {
    const col = db.collection<{ title: any }>("tasks");
    await col.insertMany([
      { title: "urgent task" },
      { title: 42 },
      { title: true },
      { title: null },
      { title: { text: "urgent" } },
    ]);

    const results = await col.find({ title: { $regex: /urgent/ } });
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("urgent task");
  });

  it("should explicitly handle null and undefined fields safely", async () => {
    const col = db.collection<{ value: any }>("items");
    await col.insertMany([{ value: "match-me" }, { value: null }, { value: undefined }]);

    const results = await col.find({ value: { $regex: /match/ } });
    expect(results).toHaveLength(1);
    expect(results[0]?.value).toBe("match-me");
  });

  it("should match documents using anchoring patterns like ^ and $ and properly distinguish wildcards", async () => {
    const col = db.collection<{ email: string; slug: string }>("users");
    await col.insertMany([
      { email: "john@gmail.com", slug: "getting-started" },
      { email: "jane@yahoo.com", slug: "not-getting-started" },
      { email: "bob@gmail.com", slug: "getting-started-now" },
      { email: "charlie@gmailXcom", slug: "other" },
    ]);

    // Test ^ anchor
    const startMatches = await col.find({ slug: { $regex: /^getting-started/ } });
    expect(startMatches).toHaveLength(2);

    // Test $ anchor and unescaped dot wildcard matching
    const unescapedMatches = await col.find({ email: { $regex: "@gmail.com$" } });
    // Should match john@gmail.com, bob@gmail.com, AND charlie@gmailXcom (since . is a wildcard)
    expect(unescapedMatches).toHaveLength(3);

    // Test escaped dot matching
    const escapedMatchesString = await col.find({ email: { $regex: "@gmail\\.com$" } });
    expect(escapedMatchesString).toHaveLength(2);

    const escapedMatchesRegExp = await col.find({ email: { $regex: /@gmail\.com$/ } });
    expect(escapedMatchesRegExp).toHaveLength(2);
  });

  it("should handle stateful RegExp objects (with global/sticky flags) safely across multiple matches", async () => {
    const col = db.collection<{ title: string }>("tasks");
    await col.insertMany([
      { title: "urgent fix 1" },
      { title: "urgent fix 2" },
      { title: "urgent fix 3" },
    ]);

    const globalRegex = /urgent/g;
    const results = await col.find({ title: { $regex: globalRegex } });
    // In a stateful regex, running .test() consecutively updates lastIndex.
    // Our resetting of lastIndex = 0 ensures all matches are correctly verified!
    expect(results).toHaveLength(3);
  });
});
