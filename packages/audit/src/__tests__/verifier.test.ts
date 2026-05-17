import { describe, expect, it } from "vitest";

import { verifyAuditEvent } from "../verifier";

import type { AuditEvent } from "../types/audit";

class MockVerifier {
  async verify(): Promise<boolean> {
    return true;
  }
}

describe("verifyAuditEvent", () => {
  it("fails when event payload is tampered", async () => {
    const event: AuditEvent = {
      id: "1",
      collection: "todos",
      documentId: "123",
      operation: "insert",
      actor: {
        did: "did:key:test",
        publicKey: "pub",
      },
      timestamp: 1,
      changes: [],
      parentHashes: [],
      hash: "invalid-hash",
      signature: "sig",
    };

    const valid = await verifyAuditEvent(event, new MockVerifier());

    expect(valid).toBe(false);
  });
});
