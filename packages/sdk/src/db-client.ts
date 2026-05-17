// SDK re-exports from underlying packages — keeps the SDK as a thin orchestration layer
export {
  DbClient,
  CollectionClient,
  LocalCloudBackupAdapter,
  GoogleDriveBackupTarget,
  DropboxBackupTarget,
} from "zerithdb-db";
export type {
  BackupExportOptions,
  BackupSnapshot,
  BackupUploadInput,
  BackupUploadResult,
  CloudBackupTarget,
  GoogleDriveBackupTargetOptions,
  DropboxBackupTargetOptions,
  LocalCloudBackupOptions,
} from "zerithdb-db";
export { SyncEngine } from "zerithdb-sync";
export { AuthManager } from "zerithdb-auth";
export { NetworkManager } from "zerithdb-network";
