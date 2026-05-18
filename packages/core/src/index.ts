// ─────────────────────────────────────────────────────────────────────────────
// zerithdb-core — Public API
// ─────────────────────────────────────────────────────────────────────────────
export { EventEmitter } from "./internal/event-emitter.js";
export {
  ZerithDBError,
  ZerithValidationError,
  ErrorCode,
} from "./errors.js";
export { Logger } from "./internal/logger.js";
export type {
  ZerithDBConfig,
  SyncConfig,
  AuthConfig,
  NetworkConfig,
  DebugConfig,
  ConflictResolverConfig,
} from "./types/config.js";
export type {
  Document,
  DocumentId,
  CollectionName,
  CollectionOptions,
  QueryFilter,
  QueryOptions,
  UpdateSpec,
  InsertResult,
  FindResult,
} from "./types/db.js";
export type { PeerId, PeerInfo, RoomId, NetworkMessage } from "./types/network.js";
export type { Identity, PublicKey, Signature } from "./types/auth.js";
export type {
  SyncUpdate,
  SyncState,
  AwarenessState,
  SyncPlugin,
  EphemeralPeerState,
  MediaStreamTrackMetadata,
  MediaStreamMetadata,
  ActiveSpeakerState,
  VideoParticipantState,
} from "./types/sync.js";
