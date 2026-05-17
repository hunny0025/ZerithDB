export interface AuditFieldChange {
  field: string;
  oldValueHash?: string;
  newValueHash?: string;
}

export interface AuditActor {
  did: string;
  publicKey: string;
}

export interface AuditEvent {
  id: string;

  collection: string;

  documentId: string;

  operation: "insert" | "update" | "delete";

  actor: AuditActor;

  timestamp: number;

  changes: AuditFieldChange[];

  parentHashes: string[];

  hash: string;

  signature: string;
}
