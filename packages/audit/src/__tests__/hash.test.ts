import { canonicalize, sha256 } from "../hash";

import { describe, expect, it } from "vitest";

describe("hash utilities", () => {
  it("canonicalizes object key ordering", () => {
    const a = canonicalize({
      b: 2,
      a: 1,
    });

    const b = canonicalize({
      a: 1,
      b: 2,
    });

    expect(a).toBe(b);
  });

  it("produces deterministic hashes", async () => {
    const hash1 = await sha256("zerithdb");

    const hash2 = await sha256("zerithdb");

    expect(hash1).toBe(hash2);
  });
});
