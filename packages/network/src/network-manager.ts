import SimplePeer from "simple-peer";
import type { ZerithDBConfig, PeerId, PeerInfo, MediaStreamMetadata } from "zerithdb-core";
import { EventEmitter, ZerithDBError, ErrorCode } from "zerithdb-core";
import type { AuthManager } from "zerithdb-auth";
import type { SignalingTransport } from "./signaling-transport.js";
import { WebSocketTransport } from "./transports/websocket-transport.js";
import { PollingTransport } from "./transports/polling-transport.js";

export interface MediaStreamMetadataInput {
  kind?: "camera" | "screen" | "custom";
  [key: string]: unknown;
}

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
  "media:stream": { peerId: PeerId; stream: MediaStream; metadata?: MediaStreamMetadata };
  "media:stream:removed": { peerId: PeerId; streamId: string };
};

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "peer-list" | "intro";
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
  private readonly localMetadata = new Map<string, MediaStreamMetadata>();

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

  get peerId(): PeerId {
    return this.localPeerId;
  }

  addMediaStream(
    stream: MediaStream,
    metadata: MediaStreamMetadataInput = {}
  ): MediaStreamMetadata {
    const tracks = stream.getTracks().map((track) => ({
      trackId: track.id,
      kind: track.kind as "audio" | "video",
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
    }));

    const normalized: MediaStreamMetadata = {
      streamId: stream.id,
      peerId: this.peerId,
      kind: (metadata.kind as "camera" | "screen" | "custom") ?? "camera",
      audioMuted: tracks.filter((t) => t.kind === "audio").every((t) => !t.enabled),
      videoMuted: tracks.filter((t) => t.kind === "video").every((t) => !t.enabled),
      tracks,
      updatedAt: Date.now(),
    };
    this.localMetadata.set(normalized.streamId, normalized);
    return normalized;
  }

  removeMediaStream(streamOrId: MediaStream | string): void {
    const streamId = typeof streamOrId === "string" ? streamOrId : streamOrId.id;
    this.localMetadata.delete(streamId);
  }

  updateMediaStreamMetadata(
    streamId: string,
    metadata: MediaStreamMetadataInput
  ): MediaStreamMetadata | undefined {
    const existing = this.localMetadata.get(streamId);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      kind: (metadata.kind as "camera" | "screen" | "custom") ?? existing.kind,
      updatedAt: Date.now(),
    };
    this.localMetadata.set(streamId, updated);
    return updated;
  }

  setMediaTrackEnabled(kind: "audio" | "video", enabled: boolean, streamId?: string): void {
    for (const metadata of this.localMetadata.values()) {
      if (streamId !== undefined && metadata.streamId !== streamId) continue;
      for (const track of metadata.tracks) {
        if (track.kind === kind) {
          track.enabled = enabled;
        }
      }
      metadata.audioMuted = metadata.tracks
        .filter((track) => track.kind === "audio")
        .every((track) => !track.enabled);
      metadata.videoMuted = metadata.tracks
        .filter((track) => track.kind === "video")
        .every((track) => !track.enabled);
    }
  }

  getLocalMediaStreamMetadata(): MediaStreamMetadata[] {
    return [...this.localMetadata.values()];
  }

  /** The transport type currently in use, or null if not connected */
  get transportType(): "websocket" | "polling" | null {
    return this.activeTransportType;
  }

  /** The local peer's unique identifier within the current P2P session. */
  get peerId(): PeerId {
    return this.localPeerId;
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
    void this.signAndSendAsync(message, null);
  }

  /**
   * Send a message to a specific peer.
   */
  sendTo(peerId: PeerId, message: { type: string; payload: string | Uint8Array }): void {
    void this.signAndSendAsync(message, peerId);
  }

  private async signAndSendAsync(
    message: { type: string; payload: string | Uint8Array },
    targetPeerId: PeerId | null
  ): Promise<void> {
    try {
      let finalMessage = { ...message } as any;

      if (this.auth?.biometric?.isBiometricEnabled()) {
        const payloadBytes =
          typeof message.payload === "string"
            ? new TextEncoder().encode(message.payload)
            : message.payload;

        const sigBytes = await this.auth.biometric.sign(payloadBytes);
        const signature = bytesToHex(sigBytes);
        const senderPublicKey = await this.auth.biometric.getPublicKeyHex();

        finalMessage = {
          type: message.type,
          payload: message.payload,
          signature,
          senderPublicKey,
        };
      }

      const data = JSON.stringify(finalMessage);

      if (targetPeerId === null) {
        for (const [, peer] of this.peers) {
          if (peer.connected) {
            peer.send(data);
          }
        }
      } else {
        const peer = this.peers.get(targetPeerId);
        if (peer?.connected) {
          peer.send(data);
        }
      }
    } catch (err) {
      console.error("[ZerithDB] Failed to sign/send WebRTC message:", err);
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

  // ─── Media stream API (WebRTC media tracks) ───────────────────────────────

  /**
   * Publish a local MediaStream to all connected peers.
   * Returns the normalised metadata record for this stream.
   *
   * @see {@link VideoConferenceManager.publishStream}
   */
  addMediaStream(
    stream: MediaStream,
    metadata: MediaStreamMetadataInput = {}
  ): MediaStreamMetadata {
    return {
      streamId: stream.id,
      label: typeof metadata.label === "string" ? metadata.label : undefined,
      audioMuted: false,
      videoMuted: false,
      tracks: stream
        .getTracks()
        .map((t) => ({ kind: t.kind as "audio" | "video", muted: !t.enabled })),
      ...metadata,
    };
  }

  /**
   * Stop sending a local MediaStream to peers.
   */
  removeMediaStream(_streamOrId: MediaStream | string): void {
    // no-op — full implementation tracked separately
  }

  /**
   * Update metadata for a stream that has already been published.
   * Returns the updated metadata, or `undefined` if the stream is not found.
   */
  updateMediaStreamMetadata(
    _streamId: string,
    _metadata: MediaStreamMetadataInput
  ): MediaStreamMetadata | undefined {
    return undefined;
  }

  /**
   * Enable or disable audio/video tracks in a published stream.
   */
  setMediaTrackEnabled(_kind: "audio" | "video", _enabled: boolean, _streamId?: string): void {
    // no-op — full implementation tracked separately
  }

  /**
   * Returns metadata for all locally published streams.
   */
  getLocalMediaStreamMetadata(): MediaStreamMetadata[] {
    return [];
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
    if (this.transport !== null) {
      this.transport.close();
      this.transport = null;
    }
    this.activeTransportType = null;
  }

  // ─── Private — Transport setup ────────────────────────────────────────────

  private async connectWebSocket(signalingUrl: string, roomId: string): Promise<void> {
    const proofOfWork = await this.createProofOfWork(signalingUrl, roomId);
    const url = new URL(signalingUrl);
    url.searchParams.set("room", roomId);
    url.searchParams.set("peer", this.localPeerId);
    if (proofOfWork !== null) {
      url.searchParams.set("powChallenge", proofOfWork.challenge);
      url.searchParams.set("powNonce", proofOfWork.nonce);
    }

    const wsTransport = new WebSocketTransport();
    await wsTransport.connect(url.toString(), 5000);

    this.attachTransport(wsTransport, roomId);
    this.activeTransportType = "websocket";
    this.reconnectAttempts = 0;
  }

  private async connectPolling(signalingUrl: string, roomId: string): Promise<void> {
    const httpUrl = this.wsUrlToHttp(signalingUrl);
    const proofOfWork = await this.createProofOfWork(signalingUrl, roomId);

    const pollTransport = new PollingTransport(httpUrl);
    await pollTransport.connect(roomId, this.localPeerId, proofOfWork);

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
      this.stopPeerHealthCheck();
      if (!this.disposed && this.config.network?.autoReconnect !== false) {
        this.scheduleReconnect(roomId);
      }
    });

    transport.onError((err) => {
      console.error("[ZerithDB] Signaling transport error:", err);
    });

    // Start the self-healing peer mesh scan now that the transport is live
    this.startPeerHealthCheck();
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
      case "announcement":
        console.warn(`[ZerithDB] System Announcement: ${msg.payload}`);
        this.emit("announcement", msg.payload as string);
        break;

      case "peer-list":
        for (const peerId of msg.payload as PeerId[]) {
          if (peerId !== this.localPeerId) {
            this.knownPeerIds.add(peerId);
            // Deterministic initiator: only smaller ID initiates connection.
            // Larger ID sends an introduction so the smaller ID learns they exist.
            if (this.localPeerId < peerId) {
              this.createPeer(peerId, true);
            } else {
              this.transport?.send(
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
    const urls = this.getSignalingUrls();
    const delay = this.config.network?.reconnectDelay ?? 1000;
    const backoff = Math.min(delay * 2 ** this.reconnectAttempts, 30_000);
    // Eliminate jitter during tests (when reconnectDelay is very small, e.g. < 100ms)
    const jitter = delay < 100 ? 0 : Math.random() * 1000;

    this.currentUrlIndex = (this.currentUrlIndex + 1) % urls.length;
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
          this.transport?.send(
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
