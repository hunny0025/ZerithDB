import type {
  EphemeralPeerState,
  IncomingPeerDataMessage,
  PeerId,
  ZerithDBConfig,
} from "zerithdb-core";
import { EventEmitter } from "zerithdb-core";
import type { NetworkManager } from "zerithdb-network";

export interface EphemeralSetOptions {
  /** Broadcast this update to peers. @default true */
  broadcast?: boolean;

  /** Bypass configured throttling for this update. @default false */
  immediate?: boolean;
}

type EphemeralEvents<TState extends Record<string, unknown>> = {
  change: Map<PeerId, EphemeralPeerState<TState>>;
  "peer:update": EphemeralPeerState<TState>;
  "peer:remove": { peerId: PeerId };
};

interface EphemeralWireMessage<TState extends Record<string, unknown>> {
  peerId: PeerId;
  sequence: number;
  updatedAt: number;
  state?: TState;
  remove?: boolean;
}

/**
 * Low-latency, non-persistent metadata sync over the ZerithDB WebRTC mesh.
 *
 * This is designed for fast-changing state such as mute flags, active speaker,
 * cursor position, and MediaStream metadata. Updates are sequence-numbered and
 * never written to IndexedDB or a Yjs document.
 */
export class EphemeralStateManager<
  TState extends Record<string, unknown> = Record<string, unknown>,
> extends EventEmitter<EphemeralEvents<TState>> {
  private readonly states = new Map<PeerId, EphemeralPeerState<TState>>();
  private readonly receivedAt = new Map<PeerId, number>();
  private localState = {} as TState;
  private sequence = 0;
  private enabled = false;
  private broadcastTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly config: ZerithDBConfig,
    private readonly network: NetworkManager
  ) {
    super();
    this.onNetworkMessage = this.onNetworkMessage.bind(this);
  }

  /** Start listening for peer ephemeral updates. */
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.network.on("message", this.onNetworkMessage);

    const cleanupIntervalMs = this.config.sync?.ephemeral?.cleanupIntervalMs ?? 5000;
    this.cleanupTimer = setInterval(() => {
      this.pruneStalePeers();
    }, cleanupIntervalMs);
  }

  /** Stop listening for peer ephemeral updates and cancel pending broadcasts. */
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.network.off("message", this.onNetworkMessage);
    if (this.broadcastTimer !== null) {
      clearTimeout(this.broadcastTimer);
      this.broadcastTimer = null;
    }
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Replace this peer's full ephemeral state.
   */
  setLocalState(state: TState, options: EphemeralSetOptions = {}): EphemeralPeerState<TState> {
    this.localState = { ...state };
    return this.commitLocalState(options);
  }

  /**
   * Shallow-merge fields into this peer's ephemeral state.
   */
  patchLocalState(
    partial: Partial<TState>,
    options: EphemeralSetOptions = {}
  ): EphemeralPeerState<TState> {
    this.localState = { ...this.localState, ...partial };
    return this.commitLocalState(options);
  }

  /**
   * Set one field on this peer's ephemeral state.
   */
  setLocalField<K extends keyof TState>(
    key: K,
    value: TState[K],
    options: EphemeralSetOptions = {}
  ): EphemeralPeerState<TState> {
    this.localState = { ...this.localState, [key]: value };
    return this.commitLocalState(options);
  }

  /**
   * Remove this peer's state locally and broadcast a tombstone to peers.
   */
  removeLocalState(options: EphemeralSetOptions = {}): void {
    this.sequence++;
    this.localState = {} as TState;
    this.states.delete(this.network.peerId);
    this.receivedAt.delete(this.network.peerId);
    this.emit("peer:remove", { peerId: this.network.peerId });
    this.emit("change", this.getStates());

    if (options.broadcast ?? true) {
      this.broadcast({ remove: true, immediate: options.immediate });
    }
  }

  /** Current local ephemeral state. */
  getLocalState(): Readonly<TState> {
    return this.localState;
  }

  /** Latest known local and remote peer states. */
  getStates(): Map<PeerId, EphemeralPeerState<TState>> {
    return new Map(this.states);
  }

  /** Latest known state for one peer. */
  getPeerState(peerId: PeerId): EphemeralPeerState<TState> | undefined {
    return this.states.get(peerId);
  }

  /** Clear timers and listeners. */
  dispose(): void {
    this.disable();
    this.states.clear();
    this.receivedAt.clear();
  }

  private commitLocalState(options: EphemeralSetOptions): EphemeralPeerState<TState> {
    this.sequence++;
    const snapshot: EphemeralPeerState<TState> = {
      peerId: this.network.peerId,
      state: { ...this.localState },
      sequence: this.sequence,
      updatedAt: Date.now(),
    };

    this.states.set(snapshot.peerId, snapshot);
    this.receivedAt.set(snapshot.peerId, Date.now());
    this.emit("peer:update", snapshot);
    this.emit("change", this.getStates());

    if (options.broadcast ?? true) {
      this.broadcast({ immediate: options.immediate });
    }

    return snapshot;
  }

  private broadcast(options: { immediate?: boolean; remove?: boolean } = {}): void {
    if (!this.enabled) return;

    const throttleMs = this.config.sync?.ephemeral?.throttleMs ?? 0;
    if (options.immediate || throttleMs <= 0) {
      if (this.broadcastTimer !== null) {
        clearTimeout(this.broadcastTimer);
        this.broadcastTimer = null;
      }
      this.flushBroadcast(options.remove ?? false);
      return;
    }

    if (this.broadcastTimer !== null) {
      if (!options.remove) return;
      clearTimeout(this.broadcastTimer);
      this.broadcastTimer = null;
    }

    this.broadcastTimer = setTimeout(() => {
      this.broadcastTimer = null;
      this.flushBroadcast(options.remove ?? false);
    }, throttleMs);
  }

  private flushBroadcast(remove: boolean): void {
    const message: EphemeralWireMessage<TState> = {
      peerId: this.network.peerId,
      sequence: this.sequence,
      updatedAt: Date.now(),
      ...(remove ? { remove: true } : { state: { ...this.localState } }),
    };

    this.network.broadcast({
      type: "ephemeral",
      payload: JSON.stringify(message),
    });
  }

  private onNetworkMessage(msg: IncomingPeerDataMessage): void {
    if (msg.type !== "ephemeral" || typeof msg.payload !== "string") return;

    let decoded: EphemeralWireMessage<TState>;
    try {
      decoded = JSON.parse(msg.payload) as EphemeralWireMessage<TState>;
    } catch {
      return;
    }
    if (decoded.peerId === this.network.peerId) return;
    if (decoded.peerId !== msg.from) return;

    const previous = this.states.get(decoded.peerId);
    if (previous !== undefined && decoded.sequence <= previous.sequence) return;

    if (decoded.remove) {
      this.states.delete(decoded.peerId);
      this.receivedAt.delete(decoded.peerId);
      this.emit("peer:remove", { peerId: decoded.peerId });
      this.emit("change", this.getStates());
      return;
    }

    if (decoded.state === undefined) return;

    const snapshot: EphemeralPeerState<TState> = {
      peerId: decoded.peerId,
      state: decoded.state,
      sequence: decoded.sequence,
      updatedAt: decoded.updatedAt,
    };
    this.states.set(decoded.peerId, snapshot);
    this.receivedAt.set(decoded.peerId, Date.now());
    this.emit("peer:update", snapshot);
    this.emit("change", this.getStates());
  }

  private pruneStalePeers(): void {
    const staleAfterMs = this.config.sync?.ephemeral?.staleAfterMs ?? 30_000;
    const now = Date.now();
    let removed = false;

    for (const [peerId, lastSeenAt] of this.receivedAt) {
      if (peerId === this.network.peerId) continue;
      if (now - lastSeenAt <= staleAfterMs) continue;

      this.states.delete(peerId);
      this.receivedAt.delete(peerId);
      this.emit("peer:remove", { peerId });
      removed = true;
    }

    if (removed) {
      this.emit("change", this.getStates());
    }
  }
}
