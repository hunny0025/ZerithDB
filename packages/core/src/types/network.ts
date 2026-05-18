/** UUID v4 peer identifier — assigned on connection */
export type PeerId = string;

/** Room identifier — formatted as `appId:collectionName` */
export type RoomId = string;

/** Information about a connected peer in the mesh network. */
export interface PeerInfo {
  /** Unique identifier for this peer */
  peerId: PeerId;
  /** W3C DID Key identifier of the peer */
  did: string;
  /** Base58-encoded Ed25519 public key of the peer */
  publicKey: string;
  /** Optional human-readable peer alias */
  name?: string;

  /** Optional ENS identity */
  ens?: string;

  /** Connection established timestamp in Unix milliseconds */
  connectedAt: number;
}

/** A message exchanged between peers over the WebRTC data channel. */
export interface NetworkMessage {
  /** Discriminator for the message kind */
  type:
    | "sync-update"
    | "awareness"
    | "ephemeral"
    | "media-stream-metadata"
    | "media-stream-removed"
    | "ping"
    | "pong";
  /** Peer ID of the sender */
  from: PeerId;
  /** Binary (Yjs update) or string (signaling metadata) payload */
  payload: Uint8Array | string;
  /** Optional Ed25519 signature for authenticity verification */
  signature?: string;
}

export type MediaStreamKind = "camera" | "screen" | "audio" | "custom";

export interface MediaTrackMetadata {
  trackId: string;
  kind: "audio" | "video";
  label?: string;
  enabled: boolean;
  muted: boolean;
  readyState: MediaStreamTrackState;
}

export interface MediaStreamMetadata {
  streamId: string;
  peerId: PeerId;
  kind: MediaStreamKind;
  label?: string;
  audioMuted: boolean;
  videoMuted: boolean;
  tracks: MediaTrackMetadata[];
  updatedAt: number;
  [key: string]: unknown;
}
