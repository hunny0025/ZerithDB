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
  type: "offer" | "answer" | "ice-candidate" | "peer-list";
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
    // Cancel any pending reconnect before starting a new connection attempt
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Tear down any existing WebSocket cleanly to prevent stale event handlers
    // from triggering reconnect loops after the socket is replaced.
    if (this.ws !== null) {
      const stale = this.ws;
      stale.onopen = null;
      stale.onerror = null;
      stale.onmessage = null;
      stale.onclose = null;
      if (
        stale.readyState !== WebSocket.CLOSING &&
        stale.readyState !== WebSocket.CLOSED
      ) {
        stale.close();
      }
      this.ws = null;
    }

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
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(
          new ZerithDBError(ErrorCode.NETWORK_SIGNALING_FAILED, "WebSocket signaling error", {
            cause: err,
          })
        );
      };

      // Wrap JSON.parse to prevent malformed messages from breaking the lifecycle
      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          this.handleSignalingMessage(JSON.parse(event.data) as SignalingMessage);
        } catch {
          // Ignore malformed signaling messages
        }
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
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
    for (const [, peer] of this.peers) {
      peer.destroy();
    }
    this.peers.clear();
    this.peerInfo.clear();
    if (this.ws !== null) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private handleSignalingMessage(msg: SignalingMessage): void {
    switch (msg.type) {
      case "peer-list":
        // Server sends list of existing peers — initiate connections
        for (const peerId of msg.payload as PeerId[]) {
          if (peerId !== this.localPeerId) {
            this.createPeer(peerId, true);
          }
        }
        break;

      case "offer":
        if (msg.to === this.localPeerId) {
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
      this.emit("peer:disconnected", { peerId: remotePeerId });
    });

    peer.on("error", (err: Error) => {
      this.emit("error", { peerId: remotePeerId, error: err });
      this.peers.delete(remotePeerId);
      this.peerInfo.delete(remotePeerId);
    });

    this.peers.set(remotePeerId, peer);
  }

  private scheduleReconnect(roomId: string): void {
    // Always cancel an existing timer before scheduling a new one.
    // Without this, multiple onclose events (e.g., from stale sockets) could
    // spawn parallel reconnect loops, compounding memory usage over time.
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const delay = this.config.network?.reconnectDelay ?? 1000;
    const backoff = Math.min(delay * 2 ** this.reconnectAttempts, 30_000);
    const jitter = Math.random() * 1000;

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect(roomId);
    }, backoff + jitter);
  }
}
