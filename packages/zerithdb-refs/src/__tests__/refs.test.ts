import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, isRef, isHydrated, extractRefs } from "../ref";
import {
  hydrateRef,
  hydrateDocument,
  registerP2PFetcher,
  clearHydrationCache,
  type CollectionAdapter,
} from "../hydrate";
import { subscribeToRefs, watchRef, emitDocChange, listenerCount } from "../reactive";

const mockDB: Record<string, Record<string, Record<string, unknown>>> = {
  users: {
    "user-123": { id: "user-123", name: "Alice", role: "admin" },
    "user-456": { id: "user-456", name: "Bob", role: "member" },
  },
  tags: { "tag-js": { id: "tag-js", label: "JavaScript" } },
};

const adapter: CollectionAdapter = (collectionName) => ({
  async findOne({ id }: { id: string }) {
    return mockDB[collectionName]?.[id] ?? null;
  },
});

describe("ref()", () => {
  it("creates a DocumentRef", () => {
    const r = ref("users", "user-123");
    expect(r.__ref).toBe(true);
    expect(r.collection).toBe("users");
    expect(r.id).toBe("user-123");
  });
  it("throws if collection is empty", () => {
    expect(() => ref("", "user-123")).toThrow();
  });
  it("throws if id is empty", () => {
    expect(() => ref("users", "")).toThrow();
  });
});

describe("isRef() / isHydrated()", () => {
  it("isRef() returns true for a raw ref", () => {
    expect(isRef(ref("users", "user-123"))).toBe(true);
  });
  it("isRef() returns false for plain object", () => {
    expect(isRef({ name: "Alice" })).toBe(false);
  });
  it("isHydrated() returns true for hydrated ref", () => {
    const h = {
      __ref: true,
      __hydrated: true,
      collection: "users",
      id: "x",
      createdAt: "",
      data: {},
      fromCache: true,
    };
    expect(isHydrated(h)).toBe(true);
  });
});

describe("extractRefs()", () => {
  it("finds top-level ref", () => {
    const refs = extractRefs({ author: ref("users", "user-123"), title: "Hi" });
    expect(refs).toHaveLength(1);
    expect(refs[0].fieldPath).toBe("author");
  });
  it("finds nested ref", () => {
    const refs = extractRefs({ meta: { editor: ref("users", "user-456") } });
    expect(refs[0].fieldPath).toBe("meta.editor");
  });
  it("finds refs in arrays", () => {
    const refs = extractRefs({ tags: [ref("tags", "tag-js")] });
    expect(refs[0].fieldPath).toBe("tags[0]");
  });
});

describe("hydrateRef()", () => {
  beforeEach(() => clearHydrationCache());
  it("resolves ref from local cache", async () => {
    const hydrated = await hydrateRef(ref("users", "user-123"), adapter);
    expect(hydrated.__hydrated).toBe(true);
    expect(hydrated.data).toEqual({ id: "user-123", name: "Alice", role: "admin" });
  });
  it("returns null for missing doc", async () => {
    const hydrated = await hydrateRef(ref("users", "nonexistent"), adapter);
    expect(hydrated.data).toBeNull();
  });
});

describe("hydrateDocument()", () => {
  beforeEach(() => clearHydrationCache());
  it("hydrates all refs in a document", async () => {
    const result = await hydrateDocument(
      { title: "Hello", author: ref("users", "user-123") },
      adapter
    );
    expect(isHydrated(result.author)).toBe(true);
    expect((result.author as any).data.name).toBe("Alice");
  });
  it("does not mutate original", async () => {
    const authorRef = ref("users", "user-123");
    const post = { title: "Test", author: authorRef };
    await hydrateDocument(post, adapter);
    expect(isRef(post.author)).toBe(true);
  });
});

describe("subscribeToRefs()", () => {
  it("calls onChange when ref changes", () => {
    const onChange = vi.fn();
    const sub = subscribeToRefs({ author: ref("users", "user-123") }, adapter, { onChange });
    emitDocChange("users", "user-123", { id: "user-123", name: "Alice Updated" });
    expect(onChange).toHaveBeenCalledOnce();
    sub.unsubscribe();
  });
  it("stops after unsubscribe", () => {
    const onChange = vi.fn();
    const sub = subscribeToRefs({ author: ref("users", "user-456") }, adapter, { onChange });
    sub.unsubscribe();
    emitDocChange("users", "user-456", { id: "user-456", name: "Bob Updated" });
    expect(onChange).not.toHaveBeenCalled();
  });
});
