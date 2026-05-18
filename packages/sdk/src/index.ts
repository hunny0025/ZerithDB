// zerithdb-sdk — public API
export { createApp } from "./create-app.js";
export type { ZerithDBApp } from "./create-app.js";
export { LLMConflictResolver } from "./conflict-resolution/resolver.js";
export type { LLMConflictResolverOptions } from "./conflict-resolution/resolver.js";
export { createTransformersResolver } from "./resolvers/transformers-resolver.js";
export {
  LocalCloudBackupAdapter,
  GoogleDriveBackupTarget,
  DropboxBackupTarget,
} from "./db-client.js";
export type {
  BackupExportOptions,
  BackupSnapshot,
  BackupUploadInput,
  BackupUploadResult,
  CloudBackupTarget,
  GoogleDriveBackupTargetOptions,
  DropboxBackupTargetOptions,
  LocalCloudBackupOptions,
} from "./db-client.js";

// Re-export commonly used types from zerithdb-core
export type {
  ZerithDBConfig,
  SyncConfig,
  AuthConfig,
  NetworkConfig,
  Document,
  DocumentId,
  CollectionName,
  QueryFilter,
  UpdateSpec,
  InsertResult,
  Identity,
  PeerInfo,
  SyncState,
  ConflictResolverConfig,
  ConflictResolver,
} from "zerithdb-core";

export { ZerithDBError, ErrorCode } from "zerithdb-errors";
