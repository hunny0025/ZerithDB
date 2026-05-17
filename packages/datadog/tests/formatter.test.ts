import { describe, it, expect } from "vitest";
import { formatForDatadog, formatBatch } from "../src/formatter";

const baseOpts = {
  service: "test-service",
  env:     "test",
  tags:    ["team:core"],
};

describe("formatForDatadog", () => {
  it("maps warn → warning", () => {
    const result = formatForDatadog(
      { level: "warn", message: "low memory" },
      baseOpts
    );
    expect(result.status).toBe("warning");
  });

  it("includes env and custom tags in ddtags", () => {
    const result = formatForDatadog(
      { level: "info", message: "ok" },
      baseOpts
    );
    expect(result.ddtags).toContain("env:test");
    expect(result.ddtags).toContain("team:core");
  });

  it("spreads context fields onto root payload", () => {
    const result = formatForDatadog(
      { level: "error", message: "oops", context: { peerId: "abc" } },
      baseOpts
    );
    expect((result as any).peerId).toBe("abc");
  });

  it("timestamp is ISO 8601", () => {
    const result = formatForDatadog(
      { level: "debug", message: "x" },
      baseOpts
    );
    expect(() => new Date(result.timestamp)).not.toThrow();
  });
});

describe("formatBatch", () => {
  it("returns same number of payloads as entries", () => {
    const result = formatBatch(
      [
        { level: "info", message: "a" },
        { level: "error", message: "b" },
      ],
      baseOpts
    );
    expect(result).toHaveLength(2);
  });
});