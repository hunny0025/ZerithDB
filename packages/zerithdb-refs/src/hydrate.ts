import type { DocumentRef, HydratedRef, HydrationOptions } from "./types";
import { isRef, extractRefs } from "./ref";

export interface ZerithCollection {
  findOne(query: { id: string }): Promise<Record<string, unknown> | null>;
}
export type CollectionAdapter = (collectionName: string) => ZerithCollection;

type CacheKey = string;
const _sessionCache = new Map<CacheKey, Record<string, unknown> | null>();

export function clearHydrationCache(): void {
  _sessionCache.clear();
}

export async function hydrateRef<T extends Record<string, unknown> = Record<string, unknown>>(
  docRef: DocumentRef,
  adapter: CollectionAdapter,
  options: HydrationOptions = {}
): Promise<HydratedRef<T>> {
  const { depth = 1, forceNetwork = false, p2pTimeoutMs = 5000 } = options;
  const key = docRef.collection + "::" + docRef.id;
  let data: T | null = null;
  let fromCache = false;
  if (!forceNetwork && _sessionCache.has(key)) {
    data = _sessionCache.get(key) as T | null;
    fromCache = true;
  } else {
    try {
      const col = adapter(docRef.collection);
      const local = await col.findOne({ id: docRef.id });
      if (local !== null) {
        data = local as T;
        fromCache = true;
        _sessionCache.set(key, data);
      }
    } catch (err) {
      console.warn("[zerithdb-refs] Local fetch failed:", err);
    }
    if (data === null) {
      try {
        data = await _p2pFetcher<T>(docRef, p2pTimeoutMs);
        if (data !== null) _sessionCache.set(key, data);
      } catch (err) {
        console.warn("[zerithdb-refs] P2P fetch failed:", err);
      }
    }
  }
  if (data !== null && depth > 1) {
    data = (await hydrateDocument(data, adapter, { ...options, depth: depth - 1 })) as T;
  }
  return {
    __ref: true,
    __hydrated: true,
    collection: docRef.collection,
    id: docRef.id,
    createdAt: docRef.createdAt,
    data,
    fromCache,
  };
}

export async function hydrateDocument<T extends Record<string, unknown>>(
  doc: T,
  adapter: CollectionAdapter,
  options: HydrationOptions = {}
): Promise<T> {
  const { depth = 1 } = options;
  if (depth === 0) return doc;
  const result = JSON.parse(JSON.stringify(doc));
  const refs = extractRefs(result);
  if (refs.length === 0) return result;
  await Promise.all(
    refs.map(async ({ fieldPath, ref: docRef }) => {
      const hydrated = await hydrateRef(docRef, adapter, options);
      const parts = fieldPath.replace(/\[(\d+)\]/g, ".").split(".");
      let cursor: Record<string, unknown> = result;
      for (let i = 0; i < parts.length - 1; i++)
        cursor = cursor[parts[i]] as Record<string, unknown>;
      cursor[parts[parts.length - 1]] = hydrated;
    })
  );
  return result;
}

type P2PFetcher = <T extends Record<string, unknown>>(
  docRef: DocumentRef,
  timeoutMs: number
) => Promise<T | null>;
let _p2pFetcher: P2PFetcher = async () => null;
export function registerP2PFetcher(fetcher: P2PFetcher): void {
  _p2pFetcher = fetcher;
}
export { isRef };
