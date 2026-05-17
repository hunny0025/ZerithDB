import SimplePeer from "simple-peer";
import type { ZerithDBConfig, PeerId, PeerInfo } from "zerithdb-core";
import { EventEmitter, ZerithDBError, ErrorCode } from "zerithdb-core";
import type { AuthManager } from "zerithdb-auth";
import type { SignalingTransport } from "./signaling-transport.js";
import { WebSocketTransport } from "./transports/websocket-transport.js";
import { PollingTransport } from "./transports/polling-transport.js";

export interface WebRtcBufferStats {
  peerCount: number;
  bufferedBytes: number;
  peers: Array<{ peerId: PeerId; bufferedAmount: number }>;
}

/** simple-peer exposes the underlying RTCDataChannel as a private field */
interface SimplePeerWithChannel {
  connected: boolean;
  _channel?: RTCDataChannel;
}

type NetworkEvents = {
  "peer:connected": PeerInfo;
  "peer:disconnected": { peerId: PeerId };
  message: { type: string; payload: Uint8Array | string; from: PeerId };
  error: { peerId: PeerId; error: Error };
  "transport:downgrade": { from: "websocket"; to: "polling"; reason: string };
};

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "peer-list";
  from: string;
  to?: string;
  payload: unknown;
}

const DEFAULT_SIGNALING_URL = "wss://arpitkhandelwal810-zerith-signaling.hf.space";

/**
 * Manages WebRTC peer-to-peer connections for a ZerithDB app.
 *
 * Architecture: Full mesh — every peer connects to every other peer.
 * The signaling server only handles the initial WebRTC handshake (ICE/SDP).
 * After that, all data flows peer-to-peer over encrypted WebRTC data channels.
 *
 * Supports automatic transport fallback: if WebSocket signaling is blocked
 * (e.g. by corporate firewalls), the manager transparently downgrades to
 * HTTP long-polling.
 *
 * Supports multiple signaling server URLs with automatic failover:
 * if one server fails, the next URL in the list is tried automatically.
 */
export class NetworkManager extends EventEmitter<NetworkEvents> {
  private transport: SignalingTransport | null = null;
  private activeTransportType: "websocket" | "polling" | null = null;
  private readonly peers = new Map<PeerId, SimplePeer.Instance>();
  private readonly peerInfo = new Map<PeerId, PeerInfo>();
  private localPeerId: PeerId = crypto.randomUUID();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private disposed = false;
  private currentUrlIndex = 0;

  constructor(
    private readonly config: ZerithDBConfig,
    private readonly auth: AuthManager
  ) {
    super();
  }

  /** The transport type currently in use, or null if not connected */
  get transportType(): "websocket" | "polling" | null {
    return this.activeTransportType;
  }

  /**
   * Returns the ordered list of signaling URLs to try.
   * Supports both signalingUrls (array) and signalingUrl (single).
   * Falls back to the default URL if neither is set.
   */
  private getSignalingUrls(): string[] {
    if (this.config.sync?.signalingUrls && this.config.sync.signalingUrls.length > 0) {
      return this.config.sync.signalingUrls;
    }
    return [this.config.sync?.signalingUrl ?? DEFAULT_SIGNALING_URL];
  }

  /**
   * Connect to the signaling server and join the P2P room.
   * Tries each URL in order — automatically fails over to the next on failure.
   *
   * Transport selection per URL:
   * - `"auto"` (default): Try WebSocket first, fall back to HTTP long-polling.
   * - `"websocket"`: WebSocket only.
   * - `"polling"`: HTTP long-polling only.
   */
  async connect(roomId: string): Promise<void> {
    const urls = this.getSignalingUrls();

    for (let i = 0; i < urls.length; i++) {
      const index = (this.currentUrlIndex + i) % urls.length;
      const url = urls[index];

      try {
        await this.connectToUrl(url, roomId);
        this.currentUrlIndex = index;
        return;
      } catch {
        console.warn(`[ZerithDB] Signaling server failed: ${url}. Trying next...`);
      }
    }

    throw new ZerithDBError(
      ErrorCode.NETWORK_SIGNALING_FAILED,
      `All signaling servers failed. Tried: ${urls.join(", ")}`
    );
  }

  /**
   * Try connecting to a single signaling URL using the configured transport.
   */
  private async connectToUrl(signalingUrl: string, roomId: string): Promise<void> {
    const transportPref = this.config.sync?.transport ?? "auto";

    if (transportPref === "websocket") {
      await this.connectWebSocket(signalingUrl, roomId);
    } else if (transportPref === "polling") {
      await this.connectPolling(signalingUrl, roomId);
    } else {
      // "auto" — try WebSocket first, fall back to polling
      try {
        await this.connectWebSocket(signalingUrl, roomId);
      } catch (wsError) {
        const reason = wsError instanceof Error ? wsError.message : "WebSocket connection failed";

        this.emit("transport:downgrade", {
          from: "websocket",
          to: "polling",
          reason,
        });

        console.warn(
          `[ZerithDB] WebSocket signaling failed (${reason}). ` +
            `Falling back to HTTP long-polling.`
        );

        await this.connectPolling(signalingUrl, roomId);
      }
    }
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

  /**
   * Reads `bufferedAmount` from each peer's WebRTC data channel.
   * Used by the DevTools memory collector.
   */
  getBufferStats(): WebRtcBufferStats {
    const peers: WebRtcBufferStats["peers"] = [];
    let bufferedBytes = 0;

    for (const [peerId, peer] of this.peers) {
      const channel = (peer as SimplePeerWithChannel)._channel;
      if (!peer.connected || channel === undefined) continue;

      const bufferedAmount = channel.bufferedAmount;
      peers.push({ peerId, bufferedAmount });
      bufferedBytes += bufferedAmount;
    }

    return {
      peerCount: peers.length,
      bufferedBytes,
      peers,
    };
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
    if (this.transport !== null) {
      this.transport.close();
      this.transport = null;
    }
    this.activeTransportType = null;
  }

  // ─── Private — Transport setup ────────────────────────────────────────────

  private async connectWebSocket(signalingUrl: string, roomId: string): Promise<void> {
    const url = `${signalingUrl}?room=${encodeURIComponent(roomId)}&peer=${this.localPeerId}`;

    const wsTransport = new WebSocketTransport();
    await wsTransport.connect(url, 5000);

    this.attachTransport(wsTransport, roomId);
    this.activeTransportType = "websocket";
    this.reconnectAttempts = 0;
  }

  private async connectPolling(signalingUrl: string, roomId: string): Promise<void> {
    const httpUrl = this.wsUrlToHttp(signalingUrl);

    const pollTransport = new PollingTransport(httpUrl);
    await pollTransport.connect(roomId, this.localPeerId);

    this.attachTransport(pollTransport, roomId);
    this.activeTransportType = "polling";
    this.reconnectAttempts = 0;
  }

  private attachTransport(transport: SignalingTransport, roomId: string): void {
    if (this.transport !== null) {
      this.transport.close();
    }

    this.transport = transport;

    transport.onMessage((data: string) => {
      this.handleSignalingMessage(JSON.parse(data) as SignalingMessage);
    });

    transport.onClose(() => {
      if (!this.disposed && this.config.network?.autoReconnect !== false) {
        this.scheduleReconnect(roomId);
      }
    });

    transport.onError((err) => {
      console.error("[ZerithDB] Signaling transport error:", err);
    });
  }

  private wsUrlToHttp(wsUrl: string): string {
    if (wsUrl.startsWith("wss://")) {
      return "https://" + wsUrl.slice(6);
    }
    if (wsUrl.startsWith("ws://")) {
      return "http://" + wsUrl.slice(5);
    }
    return wsUrl;
  }

  // ─── Private — Signaling message handling ─────────────────────────────────

  private handleSignalingMessage(msg: SignalingMessage): void {
    switch (msg.type) {
      case "peer-list":
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
      // simple-peer fires 'signal' for offers, answers, AND trickle ICE candidates.
      // We must use data.type to send the correct signaling message type.
      const signalingType =
        data.type === "offer" ? "offer" : data.type === "answer" ? "answer" : "ice-candidate";
      this.transport?.send(
        JSON.stringify({
          type: signalingType,
          from: this.localPeerId,
          to: remotePeerId,
          payload: data,
        })
      );
    });

    peer.on("connect", () => {
      const info: PeerInfo = {
        peerId: remotePeerId,
        did: "",
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
    const urls = this.getSignalingUrls();
    const delay = this.config.network?.reconnectDelay ?? 1000;
    const backoff = Math.min(delay * 2 ** this.reconnectAttempts, 30_000);
    const jitter = Math.random() * 1000;

    this.currentUrlIndex = (this.currentUrlIndex + 1) % urls.length;
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      void this.connect(roomId);
    }, backoff + jitter);
  }
}
