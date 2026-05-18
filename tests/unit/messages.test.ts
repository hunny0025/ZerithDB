import { describe, expect, it } from "vitest";
import { PeerDataMessageSchema } from "../../packages/core/src/schemas/messages.js";

describe("PeerDataMessageSchema", () => {
  it("accepts valid sync-update messages", () => {
    const result = PeerDataMessageSchema.safeParse({
      type: "sync-update",
      payload: "randompayload",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid message types", () => {
    const result = PeerDataMessageSchema.safeParse({
      type: "banana",
      payload: "randompayload",
    });

    expect(result.success).toBe(false);
  });

  it("rejects extra unknown fields", () => {
    const result = PeerDataMessageSchema.safeParse({
      type: "ping",
      hacked: true,
    });

    expect(result.success).toBe(false);
  });
});
