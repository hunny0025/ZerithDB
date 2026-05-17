# Custom Index Comparators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow `CollectionClient` indexes to accept a custom comparator that drives index ordering
and range queries.

**Architecture:** Implement in-memory secondary indexes per collection in
`packages/db/src/db-client.ts`. Indexes store sorted `{ key, id }` entries plus a per-doc key cache
for fast removal. `find()` uses binary search against the sorted entries when a filter targets an
indexed field.

**Tech Stack:** TypeScript, Dexie, Vitest, pnpm (workspace), ZerithDB core errors/types.

---

## File Structure

- Modify: `packages/db/src/db-client.ts` — add index types, in-memory index state, `createIndex`,
  index maintenance, and index-aware `find`.
- Modify: `packages/db/src/index.ts` — export new index types.
- Modify: `tests/unit/db.test.ts` — add tests for comparator validation and comparator-driven range
  queries.

---

### Task 1: Add createIndex validation test + minimal index creation

**Files:**

- Modify: `tests/unit/db.test.ts:1-190`
- Modify: `packages/db/src/db-client.ts:1-260`
- Modify: `packages/db/src/index.ts:1-5`

- [ ] **Step 1: Write the failing test (comparator required for non-primitive fields)**

```ts
import { DbClient } from "../../packages/db/src/db-client.js";
import { ErrorCode } from "../../packages/core/src/index.js";
import type { ZerithDBConfig } from "../../packages/core/src/index.js";

// ...existing tests...

describe("createIndex()", () => {
  it("should require a comparator for non-primitive field values", async () => {
    const col = db.collection<{ meta: { rank: number } }>("meta");
    await col.insert({ meta: { rank: 1 } });

    await expect(col.createIndex({ name: "meta_idx", field: "meta" })).rejects.toMatchObject({
      code: ErrorCode.SDK_INVALID_CONFIG,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest tests/unit/db.test.ts -t "createIndex"`

Expected: FAIL with `createIndex is not a function` or no rejection.

- [ ] **Step 3: Implement minimal index types + createIndex validation/build**

```ts
// packages/db/src/db-client.ts
import type {
  ZerithDBConfig,
  Document,
  DocumentId,
  QueryFilter,
  InsertResult,
  UpdateSpec,
} from "zerithdb-core";

export type IndexComparator<T> = (a: T, b: T) => number;

export type IndexDefinition<T extends Record<string, any>> = {
  name: string;
  field: keyof T;
  compare?: IndexComparator<T[keyof T]>;
};

type IndexEntry = { key: unknown; id: DocumentId };

type IndexState<T extends Record<string, any>> = {
  name: string;
  field: keyof T;
  compare: IndexComparator<unknown>;
  entries: IndexEntry[];
};

const defaultIndexCompare: IndexComparator<unknown> = (a, b) => {
  if (
    (typeof a !== "string" && typeof a !== "number") ||
    (typeof b !== "string" && typeof b !== "number")
  ) {
    throw new ZerithDBError(
      ErrorCode.SDK_INVALID_CONFIG,
      "Index comparator is required for non-string/number field values."
    );
  }
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

const compareEntries = (
  compare: IndexComparator<unknown>,
  a: IndexEntry,
  b: IndexEntry
): number => {
  const result = compare(a.key, b.key);
  if (result !== 0) return result;
  return a.id.localeCompare(b.id);
};

export class CollectionClient<T extends Record<string, any> = Record<string, any>> {
  private readonly indexes = new Map<string, IndexState<T>>();
  private readonly docIndexKeys = new Map<DocumentId, Map<string, unknown>>();

  // ...

  async createIndex(def: IndexDefinition<T>): Promise<void> {
    if (!def.name || typeof def.name !== "string") {
      throw new ZerithDBError(
        ErrorCode.SDK_INVALID_CONFIG,
        "Index name must be a non-empty string."
      );
    }
    if (!def.field || typeof def.field !== "string") {
      throw new ZerithDBError(
        ErrorCode.SDK_INVALID_CONFIG,
        "Index field must be a valid string key."
      );
    }
    if (def.compare !== undefined && typeof def.compare !== "function") {
      throw new ZerithDBError(
        ErrorCode.SDK_INVALID_CONFIG,
        "Index compare must be a function when provided."
      );
    }

    const comparator = (def.compare ?? defaultIndexCompare) as IndexComparator<unknown>;
    const existing = this.indexes.get(def.name);
    if (existing) {
      if (existing.field !== def.field || existing.compare !== comparator) {
        throw new ZerithDBError(
          ErrorCode.SDK_INVALID_CONFIG,
          `Index "${def.name}" already exists with different configuration.`
        );
      }
      return;
    }

    const docs = await this.table.toArray();
    const entries: IndexEntry[] = docs.map((doc) => ({
      key: (doc as Record<string, unknown>)[def.field as string],
      id: doc._id,
    }));

    if (!def.compare) {
      for (const entry of entries) {
        defaultIndexCompare(entry.key, entry.key);
      }
    }

    entries.sort((a, b) => compareEntries(comparator, a, b));
    this.indexes.set(def.name, {
      name: def.name,
      field: def.field,
      compare: comparator,
      entries,
    });

    for (const entry of entries) {
      if (!this.docIndexKeys.has(entry.id)) {
        this.docIndexKeys.set(entry.id, new Map());
      }
      this.docIndexKeys.get(entry.id)?.set(def.name, entry.key);
    }
  }
}
```

```ts
// packages/db/src/index.ts
export { DbClient, CollectionClient } from "./db-client.js";
export type { IndexComparator, IndexDefinition } from "./db-client.js";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest tests/unit/db.test.ts -t "createIndex"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/db-client.ts packages/db/src/index.ts tests/unit/db.test.ts
git commit -m "feat(db): add createIndex validation and types" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Comparator-driven range queries + index maintenance on writes

**Files:**

- Modify: `tests/unit/db.test.ts:1-230`
- Modify: `packages/db/src/db-client.ts:1-360`

- [ ] **Step 1: Write the failing test (custom comparator drives range + order)**

```ts
describe("createIndex()", () => {
  it("should use custom comparator for range queries and ordering", async () => {
    const col = db.collection<{ name: string }>("people");
    await col.insertMany([{ name: "z" }, { name: "aa" }, { name: "bbb" }, { name: "cccc" }]);

    await col.createIndex({
      name: "name_length",
      field: "name",
      compare: (a, b) => a.length - b.length,
    });

    const results = await col.find({ name: { $gt: "m" } });
    expect(results.map((r) => r.name)).toEqual(["aa", "bbb", "cccc"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest tests/unit/db.test.ts -t "custom comparator"`

Expected: FAIL because `find()` ignores index comparators and uses default ordering.

- [ ] **Step 3: Implement index-aware find + index maintenance (insert/update/delete/clearAll)**

```ts
// packages/db/src/db-client.ts (add helpers near top-level)
type IndexCondition = {
  op: "$eq" | "$gt" | "$gte" | "$lt" | "$lte";
  value: unknown;
};

const lowerBound = (
  entries: IndexEntry[],
  key: unknown,
  compare: IndexComparator<unknown>
): number => {
  let lo = 0;
  let hi = entries.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compare(entries[mid]?.key, key) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
};

const upperBound = (
  entries: IndexEntry[],
  key: unknown,
  compare: IndexComparator<unknown>
): number => {
  let lo = 0;
  let hi = entries.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compare(entries[mid]?.key, key) <= 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
};
```

```ts
// packages/db/src/db-client.ts (inside CollectionClient)
private selectIndex(filter: QueryFilter<T>): { index: IndexState<T>; condition: IndexCondition } | undefined {
  for (const [field, rawCondition] of Object.entries(filter)) {
    const index = [...this.indexes.values()].find((i) => i.field === field);
    if (!index) continue;

    if (rawCondition === null || typeof rawCondition !== "object") {
      return { index, condition: { op: "$eq", value: rawCondition } };
    }

    const ops = rawCondition as Record<string, unknown>;
    if ("$eq" in ops) return { index, condition: { op: "$eq", value: ops["$eq"] } };
    if ("$gt" in ops) return { index, condition: { op: "$gt", value: ops["$gt"] } };
    if ("$gte" in ops) return { index, condition: { op: "$gte", value: ops["$gte"] } };
    if ("$lt" in ops) return { index, condition: { op: "$lt", value: ops["$lt"] } };
    if ("$lte" in ops) return { index, condition: { op: "$lte", value: ops["$lte"] } };
  }
  return undefined;
}

private getIndexCandidateIds(index: IndexState<T>, condition: IndexCondition): DocumentId[] {
  const { entries, compare } = index;
  let start = 0;
  let end = entries.length;
  switch (condition.op) {
    case "$gt":
      start = upperBound(entries, condition.value, compare);
      break;
    case "$gte":
      start = lowerBound(entries, condition.value, compare);
      break;
    case "$lt":
      end = lowerBound(entries, condition.value, compare);
      break;
    case "$lte":
      end = upperBound(entries, condition.value, compare);
      break;
    case "$eq":
      start = lowerBound(entries, condition.value, compare);
      end = upperBound(entries, condition.value, compare);
      break;
  }
  return entries.slice(start, end).map((entry) => entry.id);
}
```

```ts
// packages/db/src/db-client.ts (replace find + extend matchesFilter)
async find(filter: QueryFilter<T> = {}): Promise<Document<T>[]> {
  try {
    const indexMatch = this.selectIndex(filter);
    if (!indexMatch) {
      const all = await this.table.toArray();
      return all.filter((doc) => this.matchesFilter(doc, filter));
    }

    const { index, condition } = indexMatch;
    const candidateIds = this.getIndexCandidateIds(index, condition);
    if (candidateIds.length === 0) return [];

    const docs = await Promise.all(candidateIds.map((id) => this.table.get(id)));
    const comparatorOverrides = new Map<string, IndexComparator<unknown>>([
      [index.field as string, index.compare],
    ]);

    return docs
      .filter((doc): doc is Document<T> => Boolean(doc))
      .filter((doc) => this.matchesFilter(doc, filter, comparatorOverrides));
  } catch (err) {
    throw new ZerithDBError(
      ErrorCode.DB_READ_FAILED,
      `Failed to query collection "${this.collectionName}"`,
      { cause: err }
    );
  }
}

private matchesFilter(
  doc: Document<T>,
  filter: QueryFilter<T>,
  comparators?: Map<string, IndexComparator<unknown>>
): boolean {
  for (const [key, condition] of Object.entries(filter)) {
    const fieldValue = (doc as Record<string, any>)[key];
    const comparator = comparators?.get(key);

    if (condition === null || typeof condition !== "object") {
      if (fieldValue !== condition) return false;
      continue;
    }

    const ops = condition as Record<string, any>;
    if ("$eq" in ops && fieldValue !== ops["$eq"]) return false;
    if ("$ne" in ops && fieldValue === ops["$ne"]) return false;
    if ("$gt" in ops && !(comparator ? comparator(fieldValue, ops["$gt"]) > 0 : (fieldValue as any) > (ops["$gt"] as never)))
      return false;
    if ("$gte" in ops && !(comparator ? comparator(fieldValue, ops["$gte"]) >= 0 : (fieldValue as any) >= (ops["$gte"] as never)))
      return false;
    if ("$lt" in ops && !(comparator ? comparator(fieldValue, ops["$lt"]) < 0 : (fieldValue as any) < (ops["$lt"] as never)))
      return false;
    if ("$lte" in ops && !(comparator ? comparator(fieldValue, ops["$lte"]) <= 0 : (fieldValue as any) <= (ops["$lte"] as never)))
      return false;
    if ("$in" in ops && !(ops["$in"] as unknown[]).includes(fieldValue)) return false;
    if ("$nin" in ops && (ops["$nin"] as unknown[]).includes(fieldValue)) return false;
  }
  return true;
}
```

```ts
// packages/db/src/db-client.ts (index maintenance helpers)
private insertIndexEntry(index: IndexState<T>, entry: IndexEntry): void {
  const entries = index.entries;
  let lo = 0;
  let hi = entries.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compareEntries(index.compare, entries[mid]!, entry) <= 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  entries.splice(lo, 0, entry);
}

private findEntryIndex(index: IndexState<T>, key: unknown, id: DocumentId): number {
  const start = lowerBound(index.entries, key, index.compare);
  const end = upperBound(index.entries, key, index.compare);
  for (let i = start; i < end; i += 1) {
    if (index.entries[i]?.id === id) return i;
  }
  return -1;
}

private setDocIndexKey(id: DocumentId, indexName: string, key: unknown): void {
  if (!this.docIndexKeys.has(id)) {
    this.docIndexKeys.set(id, new Map());
  }
  this.docIndexKeys.get(id)?.set(indexName, key);
}

private removeDocIndexKey(id: DocumentId, indexName: string): void {
  const entry = this.docIndexKeys.get(id);
  if (!entry) return;
  entry.delete(indexName);
  if (entry.size === 0) this.docIndexKeys.delete(id);
}

private applyIndexInsert(doc: Document<T>): void {
  for (const index of this.indexes.values()) {
    const key = (doc as Record<string, unknown>)[index.field as string];
    if (index.compare === defaultIndexCompare) {
      defaultIndexCompare(key, key);
    }
    const entry = { key, id: doc._id };
    this.insertIndexEntry(index, entry);
    this.setDocIndexKey(doc._id, index.name, key);
  }
}

private applyIndexDelete(doc: Document<T>): void {
  for (const index of this.indexes.values()) {
    const key = this.docIndexKeys.get(doc._id)?.get(index.name);
    if (key === undefined) continue;
    const idx = this.findEntryIndex(index, key, doc._id);
    if (idx >= 0) index.entries.splice(idx, 1);
    this.removeDocIndexKey(doc._id, index.name);
  }
}

private applyIndexUpdate(oldDoc: Document<T>, newDoc: Document<T>): void {
  this.applyIndexDelete(oldDoc);
  this.applyIndexInsert(newDoc);
}

private async rebuildIndexes(): Promise<void> {
  if (this.indexes.size === 0) return;
  const docs = await this.table.toArray();
  this.docIndexKeys.clear();
  for (const index of this.indexes.values()) {
    const entries: IndexEntry[] = docs.map((doc) => ({
      key: (doc as Record<string, unknown>)[index.field as string],
      id: doc._id,
    }));
    entries.sort((a, b) => compareEntries(index.compare, a, b));
    index.entries = entries;
    for (const entry of entries) {
      this.setDocIndexKey(entry.id, index.name, entry.key);
    }
  }
}
```

```ts
// packages/db/src/db-client.ts (wire index maintenance into writes)
async insert(document: T): Promise<InsertResult> {
  const now = Date.now();
  const id = uuidv7();
  const doc: Document<T> = { ...document, _id: id, _createdAt: now, _updatedAt: now };

  try {
    this.applyIndexInsert(doc);
    await this.table.add(doc);
    return { id };
  } catch (err) {
    await this.rebuildIndexes();
    throw new ZerithDBError(
      ErrorCode.DB_WRITE_FAILED,
      `Failed to insert into collection "${this.collectionName}"`,
      { cause: err }
    );
  }
}

async insertMany(documents: T[]): Promise<InsertResult[]> {
  const now = Date.now();
  const docs = documents.map((doc) => ({
    ...doc,
    _id: uuidv7(),
    _createdAt: now,
    _updatedAt: now,
  })) as Document<T>[];

  try {
    for (const doc of docs) {
      this.applyIndexInsert(doc);
    }
    await this.table.bulkAdd(docs);
    return docs.map((d) => ({ id: d._id }));
  } catch (err) {
    await this.rebuildIndexes();
    throw new ZerithDBError(
      ErrorCode.DB_WRITE_FAILED,
      `Failed to bulk insert into collection "${this.collectionName}"`,
      { cause: err }
    );
  }
}

async update(filter: QueryFilter<T>, spec: UpdateSpec<T>): Promise<number> {
  try {
    const matches = await this.find(filter);
    const now = Date.now();
    const updatedDocs = matches.map((doc) => ({
      ...doc,
      ...(spec.$set ?? {}),
      _updatedAt: now,
    }));

    for (let i = 0; i < matches.length; i += 1) {
      this.applyIndexUpdate(matches[i]!, updatedDocs[i] as Document<T>);
    }

    await this.table.bulkPut(updatedDocs);
    return matches.length;
  } catch (err) {
    await this.rebuildIndexes();
    throw new ZerithDBError(
      ErrorCode.DB_WRITE_FAILED,
      `Failed to update documents in "${this.collectionName}"`,
      { cause: err }
    );
  }
}

async delete(filter: QueryFilter<T>): Promise<number> {
  try {
    const matches = await this.find(filter);
    for (const doc of matches) {
      this.applyIndexDelete(doc);
    }
    await this.table.bulkDelete(matches.map((d) => d._id));
    return matches.length;
  } catch (err) {
    await this.rebuildIndexes();
    throw new ZerithDBError(
      ErrorCode.DB_DELETE_FAILED,
      `Failed to delete documents from "${this.collectionName}"`,
      { cause: err }
    );
  }
}

async clearAll(): Promise<void> {
  try {
    for (const index of this.indexes.values()) {
      index.entries = [];
    }
    this.docIndexKeys.clear();
    await this.table.clear();
  } catch (err) {
    await this.rebuildIndexes();
    throw new ZerithDBError(
      ErrorCode.DB_DELETE_FAILED,
      `Failed to clear collection "${this.collectionName}"`,
      { cause: err }
    );
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest tests/unit/db.test.ts -t "custom comparator"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/db-client.ts tests/unit/db.test.ts
git commit -m "feat(db): add comparator-backed in-memory indexes" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Final verification

**Files:** (no changes)

- [ ] **Step 1: Run full unit tests**

Run: `pnpm exec vitest tests/unit/db.test.ts`

Expected: PASS

- [ ] **Step 2: No commit needed**

No code changes in this task, so no commit.

---

## Plan Self-Review

1. **Spec coverage:** API surface, runtime-only indexes, comparator-driven range queries, error
   handling, and tests are all covered by Tasks 1–2.
2. **Placeholder scan:** No TODO/TBD language. All steps include concrete code and commands.
3. **Type consistency:** `IndexComparator` and `IndexDefinition` are defined and exported; method
   signatures and usages match across tasks.
