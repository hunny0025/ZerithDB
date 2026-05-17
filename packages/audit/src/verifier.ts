import type { AuditEvent } from "./types/audit";

import { createEventHash } from "./hash";

export interface SignatureVerifier {
  verify(payload: string, signature: string, publicKey: string): Promise<boolean>;
}

export async function verifyAuditEvent(
  event: AuditEvent,
  verifier: SignatureVerifier
): Promise<boolean> {
  const { hash, signature, ...unsignedEvent } = event;

  const recomputedHash = await createEventHash(unsignedEvent);

  if (recomputedHash !== hash) {
    return false;
  }

  return verifier.verify(hash, signature, event.actor.publicKey);
}
