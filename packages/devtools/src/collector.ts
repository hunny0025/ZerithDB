import type { MemorySnapshot } from "./types.js";
import { ZERITH_MEMORY_EVENT } from "./types.js";

export interface MemoryCollectorDeps {
  measureIndexedDB: () => Promise<MemorySnapshot["indexedDB"]>;
  measureWebRTC: () => MemorySnapshot["webrtc"];
}

/**
 * Periodically samples ZerithDB memory usage and broadcasts snapshots
 * to the Chrome DevTools panel via DOM events and window hooks.
 */
export class MemoryCollector {
  private timer: ReturnType<typeof setInterval> | null = null;
  private latest: MemorySnapshot | undefined;

  constructor(private readonly deps: MemoryCollectorDeps) {}

  start(intervalMs = 2000): void {
    this.stop();
    void this.sampleAndBroadcast();

    this.timer = setInterval(() => {
      void this.sampleAndBroadcast();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getLatestSnapshot(): MemorySnapshot | undefined {
    return this.latest;
  }

  private async sampleAndBroadcast(): Promise<void> {
    const snapshot = await this.collect();
    this.latest = snapshot;
    this.publish(snapshot);
  }

  private async collect(): Promise<MemorySnapshot> {
    const [indexedDB, webrtc] = await Promise.all([
      this.deps.measureIndexedDB(),
      Promise.resolve(this.deps.measureWebRTC()),
    ]);

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      indexedDB,
      webrtc,
    };

    const perfMemory = performance as Performance & {
      memory?: { usedJSHeapSize: number };
    };
    if (perfMemory.memory !== undefined) {
      snapshot.jsHeap = perfMemory.memory.usedJSHeapSize;
    }

    return snapshot;
  }

  private publish(snapshot: MemorySnapshot): void {
    if (typeof window === "undefined") return;

    window.__ZERITH_MEMORY_LATEST__ = snapshot;
    window.__ZERITH_DEVTOOLS_HOOK__ = {
      getLatestSnapshot: () => this.latest,
    };

    window.dispatchEvent(
      new CustomEvent(ZERITH_MEMORY_EVENT, {
        detail: snapshot,
      })
    );
  }
}

/**
 * Estimates IndexedDB usage via the Storage Manager API.
 */
export async function estimateStorageBytes(): Promise<number> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return 0;
  }

  const estimate = await navigator.storage.estimate();
  return estimate.usage ?? 0;
}
