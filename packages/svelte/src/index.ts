import { readable, derived } from "svelte/store";
import { createApp } from "zerithdb-sdk";
import type { ZerithDBConfig } from "zerithdb-sdk";

let client: any = null;

/**
 * Initialize ZerithDB. Call this once in your app root.
 */
export function initZerith(config: ZerithDBConfig) {
  client = createApp(config);
  return client;
}

/**
 * Get the ZerithDB client instance.
 */
export function getZerith() {
  if (!client) {
    throw new Error("ZerithDB not initialized. Call initZerith() first.");
  }
  return client;
}

/**
 * Reactive Svelte store for a ZerithDB collection.
 * Automatically updates when local or remote (P2P) changes occur.
 */
export function collectionStore<T = any>(collectionName: string) {
  const db = getZerith();

  const store = readable<T[]>([], (set) => {
    const collection = db.collection(collectionName);

    const unsubscribe = collection.subscribe((docs: T[]) => {
      set(docs);
    });

    return () => {
      unsubscribe();
    };
  });

  const insert = async (item: Partial<T>) => {
    return db.collection(collectionName).insert(item);
  };

  const remove = async (id: string) => {
    return db.collection(collectionName).delete(id);
  };

  return { subscribe: store.subscribe, insert, remove };
}

/**
 * Derived store that filters a collection by a predicate.
 */
export function filteredStore<T = any>(collectionName: string, predicate: (item: T) => boolean) {
  const base = collectionStore<T>(collectionName);
  const filtered = derived(base, ($items) => $items.filter(predicate));
  return filtered;
}

/**
 * Derived store that sorts a collection by a key.
 */
export function sortedStore<T = any>(collectionName: string, compareFn: (a: T, b: T) => number) {
  const base = collectionStore<T>(collectionName);
  const sorted = derived(base, ($items) => [...$items].sort(compareFn));
  return sorted;
}
