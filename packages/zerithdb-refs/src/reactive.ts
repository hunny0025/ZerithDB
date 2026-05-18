import type { DocumentRef, RefChangeCallback, SubscribeOptions } from "./types";
import { extractRefs } from "./ref";
import { hydrateDocument, type CollectionAdapter } from "./hydrate";

type ListenerKey = string;
type Listener = (newData: Record<string, unknown>) => void;
const _listeners = new Map<ListenerKey, Set<Listener>>();

function lkey(collection: string, id: string): ListenerKey {
  return collection + "::" + id;
}

export function emitDocChange(
  collection: string,
  id: string,
  newData: Record<string, unknown>
): void {
  const bucket = _listeners.get(lkey(collection, id));
  if (!bucket) return;
  for (const listener of bucket) {
    try {
      listener(newData);
    } catch (err) {
      console.error("[zerithdb-refs] Listener error:", err);
    }
  }
}

function addListener(collection: string, id: string, cb: Listener): () => void {
  const key = lkey(collection, id);
  if (!_listeners.has(key)) _listeners.set(key, new Set());
  _listeners.get(key)!.add(cb);
  return () => {
    _listeners.get(key)?.delete(cb);
    if (_listeners.get(key)?.size === 0) _listeners.delete(key);
  };
}

export interface RefSubscription {
  unsubscribe(): void;
}

export function subscribeToRefs(
  parentDoc: Record<string, unknown>,
  adapter: CollectionAdapter,
  options: SubscribeOptions
): RefSubscription {
  const { onChange, depth = 1 } = options;
  const refsFound = extractRefs(parentDoc);
  const cleanups: Array<() => void> = [];
  for (const { ref } of refsFound) {
    const cleanup = addListener(ref.collection, ref.id, async (newData) => {
      onChange(newData, ref);
      if (depth > 1) {
        try {
          await hydrateDocument(newData, adapter, { depth: depth - 1 });
        } catch (err) {
          console.warn("[zerithdb-refs] Re-hydration error:", err);
        }
      }
    });
    cleanups.push(cleanup);
  }
  return {
    unsubscribe() {
      for (const c of cleanups) c();
    },
  };
}

export function watchRef(ref: DocumentRef, callback: RefChangeCallback): () => void {
  return addListener(ref.collection, ref.id, (newData) => {
    callback(newData, ref);
  });
}

export function listenerCount(): number {
  let total = 0;
  for (const bucket of _listeners.values()) total += bucket.size;
  return total;
}
