// zerithdb-sdk — public API
export { createApp } from "./create-app.js";
export type { ZerithDBApp } from "./create-app.js";
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
} from "zerithdb-core";

export { ZerithDBError, ErrorCode } from "zerithdb-errors";
