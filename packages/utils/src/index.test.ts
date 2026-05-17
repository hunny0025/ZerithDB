import { describe, it, expect } from "vitest";
import { bytesToBase64, base64ToBytes } from "./index";

describe("Base64 Utilities", () => {
  it("should encode and decode a small array", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const b64 = bytesToBase64(bytes);
    expect(b64).toBe("SGVsbG8=");
    const decoded = base64ToBytes(b64);
    expect(decoded).toEqual(bytes);
  });

  it("should handle a large array (>100KB) without stack overflow", () => {
    const size = 200 * 1024; // 200KB
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = i % 256;
    }

    // This would throw RangeError with the old spread-based implementation
    const b64 = bytesToBase64(bytes);
    expect(b64.length).toBeGreaterThan(size);

    const decoded = base64ToBytes(b64);
    expect(decoded.length).toBe(size);
    expect(decoded).toEqual(bytes);
  });
});
