export interface IndexedDBMemoryStats {
  totalBytes: number;
  recordCount: number;
  collections: Record<string, number>;
}

export interface WebRtcPeerBufferStats {
  peerId: string;
  bufferedAmount: number;
}

export interface WebRtcMemoryStats {
  peerCount: number;
  bufferedBytes: number;
  peers: WebRtcPeerBufferStats[];
}

export interface MemorySnapshot {
  timestamp: number;
  indexedDB: IndexedDBMemoryStats;
  webrtc: WebRtcMemoryStats;
  jsHeap?: number;
}

export const ZERITH_MEMORY_EVENT = "zerith:memory" as const;

declare global {
  interface Window {
    __ZERITH_MEMORY_LATEST__?: MemorySnapshot;
    __ZERITH_DEVTOOLS_HOOK__?: {
      getLatestSnapshot: () => MemorySnapshot | undefined;
    };
  }
}
