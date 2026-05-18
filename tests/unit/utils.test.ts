import { describe, it, expect } from "vitest";

import { bytesToHex, hexToBytes, isPlainObject } from "../../packages/utils/src/index.js";

describe("utils", () => {
  it("should convert bytes to hex", () => {
    const bytes = new Uint8Array([255, 16, 32]);

    expect(bytesToHex(bytes)).toBe("ff1020");
  });

  it("should convert hex to bytes", () => {
    const result = hexToBytes("ff1020");

    expect(Array.from(result)).toEqual([255, 16, 32]);
  });

  it("should detect plain objects", () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it("should reject arrays as plain objects", () => {
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });
});
