import * as Y from "yjs";

import type { AuditActor, AuditEvent, AuditFieldChange } from "./types/audit";

import { createEventHash } from "./hash";

import { signAuditEvent, type SignableAuthManager } from "./signer";

export interface LogOperationInput {
  collection: string;

  documentId: string;

  operation: "insert" | "update" | "delete";

  actor: AuditActor;

  changes: AuditFieldChange[];
}

export class AuditManager {
  private readonly doc: Y.Doc;

  private readonly auditLog: Y.Array<AuditEvent>;

  constructor(private readonly authManager: SignableAuthManager) {
    this.doc = new Y.Doc();

    this.auditLog = this.doc.getArray<AuditEvent>("audit-log");
  }

  public get events(): AuditEvent[] {
    return this.auditLog.toArray();
  }

  public async logOperation(input: LogOperationInput): Promise<AuditEvent> {
    const parentHashes = this.auditLog
      .toArray()
      .slice(-3)
      .map((event) => event.hash);

    const baseEvent = {
      id: crypto.randomUUID(),

      collection: input.collection,

      documentId: input.documentId,

      operation: input.operation,

      actor: input.actor,

      timestamp: Date.now(),

      changes: input.changes,

      parentHashes,
    };

    const hash = await createEventHash(baseEvent);

    const signature = await signAuditEvent(hash, this.authManager);

    const event: AuditEvent = {
      ...baseEvent,
      hash,
      signature,
    };

    this.auditLog.push([event]);

    return event;
  }
}
