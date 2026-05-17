import type { PeerId } from "zerithdb-core";
import { EventEmitter } from "zerithdb-core";
import type { NetworkManager } from "zerithdb-network";
import type { LeaderState, SchedulerEvents } from "./types.js";

const HEARTBEAT_INTERVAL = 5_000;
const LEADER_TIMEOUT = 15_000;

export class LeaderElection extends EventEmitter<SchedulerEvents> {
  private activePeers = new Set<PeerId>();
  private currentLeader: PeerId | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private term = 0;

  constructor(
    private readonly localPeerId: PeerId,
    private readonly network: NetworkManager
  ) {
    super();
    this.activePeers.add(localPeerId);

    this.network.on("peer:connected", (info) => {
      this.onPeerJoin(info.peerId);
    });

    this.network.on("peer:disconnected", (info) => {
      this.onPeerLeave(info.peerId);
    });

    this.network.on("message", (msg) => {
      if (msg.type === "leader:heartbeat") {
        this.resetLeaderTimeout();
      }
    });
  }

  start(): void {
    this.electLeader();
  }

  get isLeader(): boolean {
    return this.currentLeader === this.localPeerId;
  }

  get leaderState(): LeaderState | null {
    if (!this.currentLeader) return null;
    return {
      leaderId: this.currentLeader,
      electedAt: Date.now(),
      term: this.term,
    };
  }

  dispose(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private electLeader(): void {
    const sorted = [...this.activePeers].sort();
    const newLeader = sorted.at(-1) as PeerId;
    const previous = this.currentLeader;

    if (newLeader === this.currentLeader) return;

    this.currentLeader = newLeader;
    this.term++;

    if (newLeader === this.localPeerId) {
      this.startHeartbeat();
      const leaderId = newLeader;
      EventEmitter.prototype.emit.call(this, "leader:elected", { leaderId });
    } else {
      this.resetLeaderTimeout();
      if (previous === this.localPeerId) {
        const previousLeader = previous;
        EventEmitter.prototype.emit.call(this, "leader:lost", { previousLeader });
      }
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.network.broadcast({
        type: "leader:heartbeat",
        payload: this.localPeerId,
      });
    }, HEARTBEAT_INTERVAL);
  }

  private resetLeaderTimeout(): void {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      if (this.currentLeader) {
        this.activePeers.delete(this.currentLeader);
      }
      this.electLeader();
    }, LEADER_TIMEOUT);
  }

  private onPeerJoin(peerId: PeerId): void {
    this.activePeers.add(peerId);
    this.electLeader();
  }

  private onPeerLeave(peerId: PeerId): void {
    this.activePeers.delete(peerId);
    this.electLeader();
  }
}
