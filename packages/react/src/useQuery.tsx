import React, { useEffect, useState, useCallback } from "react";
import type { QueryFilter } from "zerithdb-sdk";
import { liveQuery } from "dexie";
import { useZerith } from "./useZerith";

// Helper hook to deep-compare the filter to avoid unnecessary re-subscriptions
function useDeepCompareMemoize<T>(value: T) {
  const ref = React.useRef<T>(value);
  if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Reactive hook to query a collection.
 * Automatically updates when local or remote (P2P) changes occur.
 * @param collectionName The name of the collection to query
 * @param filter A MongoDB-style query filter. Must be JSON-serializable.
 */
export function useQuery<T extends Record<string, any> = Record<string, any>>(
  collectionName: string,
  filter: QueryFilter<T> = {}
) {
  const app = useZerith();
  const [data, setData] = useState<(T & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedFilter = useDeepCompareMemoize(filter);

  useEffect(() => {
    const collection = app.db<T>(collectionName);

    // Use Dexie's liveQuery to reactively observe local DB changes
    // (which also includes remote P2P updates applied by the sync engine)
    const observable = liveQuery(() => collection.find(memoizedFilter));

    const subscription = observable.subscribe({
      next: (docs) => {
        setData(docs as (T & { _id: string })[]);
        setLoading(false);
      },
      error: (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [app, collectionName, memoizedFilter]);

  const insert = useCallback(
    async (item: T) => {
      return app.db<T>(collectionName).insert(item);
    },
    [app, collectionName]
  );

  const remove = useCallback(
    async (id: string) => {
      // delete() takes a QueryFilter, not a raw id string
      return app.db<T>(collectionName).delete({ _id: id } as any);
    },
    [app, collectionName]
  );

  return { data, loading, error, insert, remove };
}
