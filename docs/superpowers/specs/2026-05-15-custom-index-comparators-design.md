# Custom Index Comparators for ZerithDB Collections

## Summary

Enable collection indexes to accept a user-provided comparator so index ordering and range
comparisons use custom semantics rather than only default lexicographical/numeric ordering.

## Context

`zerithdb-db` currently stores documents in Dexie and performs `find()` via a full scan with
in-memory filtering. There is no index API yet. This spec introduces an in-memory secondary-index
layer inside `CollectionClient` with a comparator hook, scoped to runtime and rebuilt on startup.

## Goals

1. Allow users to create indexes with a custom comparator `(a, b) => number`.
2. Use that comparator for index ordering and range comparisons (`$gt/$gte/$lt/$lte`).
3. Preserve existing equality semantics (`$eq`, `$in`, `$nin`) for all fields, including indexed
   fields.
4. Keep the feature runtime-only (non-persisted); callers must re-register indexes on startup.

## Non-goals

- Persistent on-disk index storage.
- Compound/ multi-field indexes.
- Query planners, multi-index intersection, or optimizer heuristics.
- New query operators or sort-by options.

## API Surface

Add an index creation method to `CollectionClient`:

```ts
type IndexComparator<T> = (a: T, b: T) => number;

type IndexDefinition<T> = {
  name: string;
  field: keyof T;
  compare?: IndexComparator<T[keyof T]>;
};

class CollectionClient<T> {
  createIndex(def: IndexDefinition<T>): Promise<void>;
}
```

Behavior:

- `compare` is optional for `string` and `number` fields; it is required for other field types.
- Re-creating an index with the same name but a different `field` or comparator reference throws
  `SDK_INVALID_CONFIG`.
- Indexes are in-memory only; the user must call `createIndex` after startup.

## Index Storage & Lifecycle

Each `CollectionClient` maintains:

- `indexes: Map<string, IndexState>` where `IndexState = { field, compare, entries }`
- `entries: { key: unknown; id: DocumentId }[]` sorted by `compare`
- `docIndexKeys: Map<DocumentId, Map<string, unknown>>` for fast removal on updates/deletes

Lifecycle:

1. **createIndex**: read all docs from Dexie, build entries, sort with comparator.
2. **insert**: compute key, binary-insert into `entries`, update `docIndexKeys`.
3. **update**: remove old entry using `docIndexKeys`, insert new entry.
4. **delete**: remove entry for each deleted doc.
5. **clearAll**: clear `entries` and `docIndexKeys`.

## Query Behavior

`find(filter)`:

- If the filter includes an indexed field with `$eq/$gt/$gte/$lt/$lte`, use that index to obtain
  candidate IDs via binary search.
- Fetch candidate documents in index order.
- Apply `matchesFilter` to candidates, using the comparator for range comparisons on indexed fields.
- If no index applies, fallback to current full-scan behavior.

Comparator semantics:

- `$gt/$gte/$lt/$lte` use `compare(fieldValue, value)` for indexed fields.
- `$eq/$in/$nin` keep strict equality semantics to preserve existing behavior.

## Error Handling

- Invalid index definitions or missing comparators for non-primitive fields: `SDK_INVALID_CONFIG`.
- Comparator errors are surfaced as `DB_READ_FAILED` during `find()` and `DB_WRITE_FAILED` during
  insert/update/delete.

## Testing

Add unit tests to `tests/unit/db.test.ts`:

1. `createIndex` accepts a custom comparator and uses it for `$gt/$lt`.
2. Results from index-backed queries come back in comparator order.
3. Creating an index on a non-string/number field without a comparator throws `SDK_INVALID_CONFIG`.

## Migration Notes

No data migration required. Existing code continues to work without change; indexes are opt-in.
