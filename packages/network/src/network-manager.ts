import SimplePeer from "simple-peer";
import type { ZerithDBConfig, PeerId, PeerInfo } from "zerithdb-core";
import { EventEmitter, ZerithDBError, ErrorCode } from "zerithdb-core";
import type { AuthManager } from "zerithdb-auth";

type NetworkEvents = {
  "peer:connected": PeerInfo;
  "peer:disconnected": { peerId: PeerId };
  message: { type: string; payload: Uint8Array | string; from: PeerId };
  error: { peerId: PeerId; error: Error };
};

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "peer-list" | "intro";
  from: string;
  to?: string;
  payload: unknown;
}

/**
 * Manages WebRTC peer-to-peer connections for a ZerithDB app.
 *
 * Architecture: Full mesh — every peer connects to every other peer.
 * The signaling server only handles the initial WebRTC handshake (ICE/SDP).
 * After that, all data flows peer-to-peer over encrypted WebRTC data channels.
 */
export class NetworkManager extends EventEmitter<NetworkEvents> {
  private ws: WebSocket | null = null;
  private readonly peers = new Map<PeerId, SimplePeer.Instance>();
  private readonly peerInfo = new Map<PeerId, PeerInfo>();
  private localPeerId: PeerId = crypto.randomUUID();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private disposed = false;

  // ─── Self-healing peer mesh ───────────────────────────────────────────────
  // Tracks every peer ID we've ever seen in the room so we can detect
  // missing connections and re-initiate them automatically.
  private readonly knownPeerIds = new Set<PeerId>();
  private readonly peerCreationTimes = new Map<PeerId, number>();
  private peerCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly config: ZerithDBConfig,
    private readonly auth: AuthManager
  ) {
    super();
  }

  /**
   * Connect to the signaling server and join the P2P room.
   * After connection, WebRTC handshakes happen automatically.
   */
  async connect(roomId: string): Promise<void> {
    const signalingUrl =
      this.config.sync?.signalingUrl ?? "wss://arpitkhandelwal810-zerith-signaling.hf.space";
    const url = `${signalingUrl}?room=${encodeURIComponent(roomId)}&peer=${this.localPeerId}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        reject(
          new ZerithDBError(
            ErrorCode.NETWORK_SIGNALING_FAILED,
            `Failed to connect to signaling server: ${signalingUrl}`,
            { cause: err }
          )
        );
        return;
      }

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startPeerHealthCheck();
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(
          new ZerithDBError(ErrorCode.NETWORK_SIGNALING_FAILED, "WebSocket signaling error", {
            cause: err,
          })
        );
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        this.handleSignalingMessage(JSON.parse(event.data) as SignalingMessage);
      };

      this.ws.onclose = () => {
        if (!this.disposed) {
          this.scheduleReconnect(roomId);
        }
      };
    });
  }

  /**
   * Broadcast a message to all connected peers.
   */
  broadcast(message: { type: string; payload: string | Uint8Array }): void {
    const data = JSON.stringify(message);
    for (const [, peer] of this.peers) {
      if (peer.connected) {
        peer.send(data);
      }
    }
  }

  /**
   * Send a message to a specific peer.
   */
  sendTo(peerId: PeerId, message: { type: string; payload: string | Uint8Array }): void {
    const peer = this.peers.get(peerId);
    if (peer?.connected) {
      peer.send(JSON.stringify(message));
    }
  }

  /** Number of currently connected peers */
  get connectedPeerCount(): number {
    let count = 0;
    for (const [, peer] of this.peers) {
      if (peer.connected) count++;
    }
    return count;
  }

  /** List of all connected peer infos */
  get connectedPeers(): PeerInfo[] {
    return [...this.peerInfo.values()];
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.stopPeerHealthCheck();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    for (const [, peer] of this.peers) {
      peer.destroy();
    }
    this.peers.clear();
    this.peerInfo.clear();
    this.knownPeerIds.clear();
    this.peerCreationTimes.clear();
    if (this.ws !== null) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private handleSignalingMessage(msg: SignalingMessage): void {
    switch (msg.type) {
      case "peer-list":
        // Server sends list of existing peers
        for (const peerId of msg.payload as PeerId[]) {
          if (peerId !== this.localPeerId) {
            this.knownPeerIds.add(peerId);
            // Deterministic initiator: only smaller ID initiates connection.
            // Larger ID sends an introduction so the smaller ID learns they exist.
            if (this.localPeerId < peerId) {
              this.createPeer(peerId, true);
            } else {
              this.ws?.send(
                JSON.stringify({
                  type: "intro",
                  from: this.localPeerId,
                  to: peerId,
                })
              );
            }
          }
        }
        break;

      case "intro":
        if (msg.to === this.localPeerId) {
          this.knownPeerIds.add(msg.from);
          // Since we received intro, we must be the smaller ID (initiator).
          // Initiate connection if we haven't already.
          if (this.localPeerId < msg.from) {
            this.createPeer(msg.from, true);
          }
        }
        break;

      case "offer":
        if (msg.to === this.localPeerId) {
          this.knownPeerIds.add(msg.from);
          const existingPeer = this.peers.get(msg.from);
          if (existingPeer) {
            existingPeer.destroy();
            this.peers.delete(msg.from);
            this.peerInfo.delete(msg.from);
          }
          this.createPeer(msg.from, false, msg.payload);
        }
        break;

      case "answer":
        this.peers.get(msg.from)?.signal(msg.payload as any);
        break;

      case "ice-candidate":
        this.peers.get(msg.from)?.signal(msg.payload as any);
        break;
    }
  }

  private createPeer(remotePeerId: PeerId, initiator: boolean, offerPayload?: unknown): void {
    if (this.peers.has(remotePeerId)) return;

    const maxPeers = this.config.sync?.maxPeers ?? 10;
    if (this.peers.size >= maxPeers) return;

    this.peerCreationTimes.set(remotePeerId, Date.now());

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: this.config.sync?.iceServers ?? [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    if (!initiator && offerPayload !== undefined) {
      peer.signal(offerPayload as any);
    }

    peer.on("signal", (data) => {
      this.ws?.send(
        JSON.stringify({
          type: initiator ? "offer" : "answer",
          from: this.localPeerId,
          to: remotePeerId,
          payload: data,
        })
      );
    });

    peer.on("connect", () => {
      const info: PeerInfo = {
        peerId: remotePeerId,
        did: "", // filled in via auth handshake message
        publicKey: "",
        connectedAt: Date.now(),
      };
      this.peerInfo.set(remotePeerId, info);
      this.emit("peer:connected", info);
    });

    peer.on("data", (data: Uint8Array | string) => {
      try {
        const msg = JSON.parse(
          typeof data === "string" ? data : new TextDecoder().decode(data)
        ) as { type: string; payload: string | Uint8Array };
        this.emit("message", { ...msg, from: remotePeerId });
      } catch {
        // Ignore malformed messages
      }
    });

    peer.on("close", () => {
      this.peers.delete(remotePeerId);
      this.peerInfo.delete(remotePeerId);
      this.peerCreationTimes.delete(remotePeerId);
      this.emit("peer:disconnected", { peerId: remotePeerId });
    });

    peer.on("error", (err: Error) => {
      this.emit("error", { peerId: remotePeerId, error: err });
      this.peers.delete(remotePeerId);
      this.peerInfo.delete(remotePeerId);
      this.peerCreationTimes.delete(remotePeerId);
    });

    this.peers.set(remotePeerId, peer);
  }

  private scheduleReconnect(roomId: string): void {
    const delay = this.config.network?.reconnectDelay ?? 1000;
    const backoff = Math.min(delay * 2 ** this.reconnectAttempts, 30_000);
    // Eliminate jitter during tests (when reconnectDelay is very small, e.g. < 100ms)
    const jitter = delay < 100 ? 0 : Math.random() * 1000;

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      void this.connect(roomId);
    }, backoff + jitter);
  }

  // ─── Self-healing peer mesh ───────────────────────────────────────────────

  /**
   * Start a periodic scan that detects missing peer connections and
   * re-initiates the WebRTC handshake for any known peer that is no longer
   * in the active `peers` map.
   *
   * To avoid dual-initiation conflicts (both sides sending an offer at the
   * same time), we use a deterministic rule: the peer whose ID is
   * lexicographically smaller acts as the initiator.
   */
  private getPeerCheckInterval(): number {
    return (this.config.network as any)?.peerCheckInterval ?? 10_000;
  }

  private startPeerHealthCheck(): void {
    this.stopPeerHealthCheck();
    this.peerCheckInterval = setInterval(() => {
      const now = Date.now();
      const handshakeTimeout = (this.config.network as any)?.handshakeTimeout ?? 5000;

      for (const remotePeerId of this.knownPeerIds) {
        const existingPeer = this.peers.get(remotePeerId);
        if (existingPeer) {
          if (existingPeer.connected) continue;

          // If the connection attempt is hung, check if it has timed out
          const createdTime = this.peerCreationTimes.get(remotePeerId) ?? 0;
          if (now - createdTime < handshakeTimeout) {
            continue; // Wait for it to connect or naturally fail
          }

          // Handshake timed out! Clean it up to let the deterministic initiator re-initiate
          existingPeer.destroy();
          this.peers.delete(remotePeerId);
          this.peerInfo.delete(remotePeerId);
          this.peerCreationTimes.delete(remotePeerId);
        }

        // Deterministic initiator: smaller ID sends the offer.
        // Larger ID periodically re-sends the introduction so the smaller ID learns they exist.
        if (this.localPeerId < remotePeerId) {
          this.createPeer(remotePeerId, true);
        } else {
          this.ws?.send(
            JSON.stringify({
              type: "intro",
              from: this.localPeerId,
              to: remotePeerId,
            })
          );
        }
      }
    }, this.getPeerCheckInterval());
  }

  private stopPeerHealthCheck(): void {
    if (this.peerCheckInterval !== null) {
      clearInterval(this.peerCheckInterval);
      this.peerCheckInterval = null;
    }
  }
}
