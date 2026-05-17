import { describe, expect, it } from "vitest";

import { AuditManager } from "../audit-manager";

class MockAuthManager {
  async sign(payload: string): Promise<string> {
    return `signed-${payload}`;
  }
}

describe("AuditManager", () => {
  it("creates audit events", async () => {
    const manager = new AuditManager(new MockAuthManager());

    const event = await manager.logOperation({
      collection: "todos",
      documentId: "1",
      operation: "insert",
      actor: {
        did: "did:key:test",
        publicKey: "public-key",
      },
      changes: [
        {
          field: "text",
          newValueHash: "abc123",
        },
      ],
    });

    expect(event.hash).toBeDefined();

    expect(event.signature).toContain("signed-");

    expect(manager.events.length).toBe(1);
  });
});
