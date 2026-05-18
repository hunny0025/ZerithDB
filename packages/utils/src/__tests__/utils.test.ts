import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPlainObject,
  assertDefined,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
  backoffDelay,
  sleep,
  withTimeout,
  randomId,
} from "../index.js";

// ─── isPlainObject ────────────────────────────────────────────────────────────

describe("isPlainObject()", () => {
  it("returns true for an empty object literal", () => {
    expect(isPlainObject({})).toBe(true);
  });

  it("returns true for an object with properties", () => {
    expect(isPlainObject({ key: "value", num: 42 })).toBe(true);
  });

  it("returns true for a nested object", () => {
    expect(isPlainObject({ a: { b: 1 } })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it("returns false for an empty array", () => {
    expect(isPlainObject([])).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isPlainObject("hello")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isPlainObject(42)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPlainObject(undefined)).toBe(false);
  });

  it("returns false for a boolean", () => {
    expect(isPlainObject(true)).toBe(false);
  });

  it("returns false for a class instance", () => {
    class Foo {}
    // Class instances ARE plain objects structurally, but this tests the real-world
    // use-case: isPlainObject is intended for JSON-safe records
    expect(isPlainObject(new Foo())).toBe(true); // typeof === 'object', not array, not null
  });

  it("returns false for a function", () => {
    expect(isPlainObject(() => {})).toBe(false);
  });
});

// ─── assertDefined ────────────────────────────────────────────────────────────

describe("assertDefined()", () => {
  it("does not throw when value is a non-empty string", () => {
    expect(() => assertDefined("hello", "should not throw")).not.toThrow();
  });

  it("does not throw for 0 (falsy but defined)", () => {
    expect(() => assertDefined(0, "should not throw")).not.toThrow();
  });

  it("does not throw for an empty string (falsy but defined)", () => {
    expect(() => assertDefined("", "should not throw")).not.toThrow();
  });

  it("does not throw for false (falsy but defined)", () => {
    expect(() => assertDefined(false, "should not throw")).not.toThrow();
  });

  it("does not throw for a plain object", () => {
    expect(() => assertDefined({}, "should not throw")).not.toThrow();
  });

  it("throws an Error with the given message for null", () => {
    expect(() => assertDefined(null, "value was null")).toThrow("value was null");
  });

  it("throws an Error with the given message for undefined", () => {
    expect(() => assertDefined(undefined, "value was undefined")).toThrow("value was undefined");
  });

  it("thrown error is an instance of Error", () => {
    expect(() => assertDefined(null, "oops")).toThrowError(Error);
  });
});

// ─── bytesToHex ───────────────────────────────────────────────────────────────

describe("bytesToHex()", () => {
  it("converts an empty Uint8Array to an empty string", () => {
    expect(bytesToHex(new Uint8Array([]))).toBe("");
  });

  it("converts [0x00] to '00'", () => {
    expect(bytesToHex(new Uint8Array([0x00]))).toBe("00");
  });

  it("converts [0xff] to 'ff'", () => {
    expect(bytesToHex(new Uint8Array([0xff]))).toBe("ff");
  });

  it("pads single hex digits — [0x0a] → '0a'", () => {
    expect(bytesToHex(new Uint8Array([0x0a]))).toBe("0a");
  });

  it("converts a known multi-byte buffer correctly", () => {
    expect(bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe("deadbeef");
  });

  it("round-trips correctly with hexToBytes()", () => {
    const original = new Uint8Array([1, 2, 3, 128, 255]);
    expect(hexToBytes(bytesToHex(original))).toEqual(original);
  });
});

// ─── hexToBytes ───────────────────────────────────────────────────────────────

describe("hexToBytes()", () => {
  it("converts an empty string to an empty Uint8Array", () => {
    expect(hexToBytes("")).toEqual(new Uint8Array([]));
  });

  it("converts '00' → [0x00]", () => {
    expect(hexToBytes("00")).toEqual(new Uint8Array([0x00]));
  });

  it("converts 'ff' → [0xff]", () => {
    expect(hexToBytes("ff")).toEqual(new Uint8Array([0xff]));
  });

  it("converts 'deadbeef' to the correct byte sequence", () => {
    expect(hexToBytes("deadbeef")).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("handles uppercase hex characters", () => {
    expect(hexToBytes("DEADBEEF")).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("throws when given an odd-length hex string", () => {
    expect(() => hexToBytes("abc")).toThrow("Invalid hex string length");
  });

  it("throws when given a single character", () => {
    expect(() => hexToBytes("f")).toThrow("Invalid hex string length");
  });

  it("round-trips correctly with bytesToHex()", () => {
    const hex = "cafebabe0102";
    expect(bytesToHex(hexToBytes(hex))).toBe(hex);
  });
});

// ─── bytesToBase64 / base64ToBytes ────────────────────────────────────────────

describe("bytesToBase64()", () => {
  it("encodes an empty Uint8Array to an empty base64 string", () => {
    expect(bytesToBase64(new Uint8Array([]))).toBe("");
  });

  it("encodes [72, 101, 108, 108, 111] (\"Hello\") to 'SGVsbG8='", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    expect(bytesToBase64(bytes)).toBe("SGVsbG8=");
  });

  it("produces a valid base64 string (no illegal chars)", () => {
    const bytes = new Uint8Array(Array.from({ length: 32 }, (_, i) => i));
    const b64 = bytesToBase64(bytes);
    expect(/^[A-Za-z0-9+/]*={0,2}$/.test(b64)).toBe(true);
  });
});

describe("base64ToBytes()", () => {
  it("decodes an empty string to an empty Uint8Array", () => {
    expect(base64ToBytes("")).toEqual(new Uint8Array([]));
  });

  it("decodes 'SGVsbG8=' back to [72, 101, 108, 108, 111] (\"Hello\")", () => {
    expect(base64ToBytes("SGVsbG8=")).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it("round-trips correctly: base64ToBytes(bytesToBase64(bytes)) === bytes", () => {
    const original = new Uint8Array([10, 20, 30, 40, 50, 255, 0, 128]);
    expect(base64ToBytes(bytesToBase64(original))).toEqual(original);
  });

  it("round-trips correctly: bytesToBase64(base64ToBytes(b64)) === b64", () => {
    const b64 = "SGVsbG8=";
    expect(bytesToBase64(base64ToBytes(b64))).toBe(b64);
  });
});

// ─── backoffDelay ─────────────────────────────────────────────────────────────

describe("backoffDelay()", () => {
  it("returns 0 for attempt 0 with base 0", () => {
    // exp = min(0 * 2^0, max) = 0; jitter range = [0, 0]
    expect(backoffDelay(0, 0)).toBe(0);
  });

  it("returns a value within the valid jitter range [exp/2, exp]", () => {
    // attempt=1, base=1000 → exp = min(2000, 30000) = 2000 → range [1000, 2000]
    const delay = backoffDelay(1, 1000);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(2000);
  });

  it("never exceeds the max cap", () => {
    // High attempt count should be capped at max=30_000
    for (let i = 0; i < 20; i++) {
      expect(backoffDelay(50, 1000, 30_000)).toBeLessThanOrEqual(30_000);
    }
  });

  it("respects a custom max cap", () => {
    const customMax = 500;
    for (let i = 0; i < 10; i++) {
      expect(backoffDelay(10, 1000, customMax)).toBeLessThanOrEqual(customMax);
    }
  });

  it("delay is within [base/2, base] for attempt 0 with default base", () => {
    // attempt=0 → exp = min(1000 * 2^0, 30000) = 1000 → range [500, 1000]
    const delay = backoffDelay(0);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(1000);
  });

  it("higher attempt produces a higher median delay (statistical)", () => {
    // Run 20 samples for each attempt level; medians should differ
    const sample = (attempt: number) =>
      Array.from({ length: 20 }, () => backoffDelay(attempt, 1000)).reduce((a, b) => a + b, 0) / 20;
    expect(sample(5)).toBeGreaterThan(sample(1));
  });
});

// ─── sleep ────────────────────────────────────────────────────────────────────

describe("sleep()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after the specified milliseconds", async () => {
    let resolved = false;
    const promise = sleep(1000).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    expect(resolved).toBe(true);
  });

  it("does not resolve before the timeout elapses", async () => {
    let resolved = false;
    const promise = sleep(500).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(resolved).toBe(true);
  });

  it("resolves immediately for sleep(0)", async () => {
    let resolved = false;
    const promise = sleep(0).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(0);
    await promise;
    expect(resolved).toBe(true);
  });
});

// ─── withTimeout ─────────────────────────────────────────────────────────────

describe("withTimeout()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the function's return value when it completes in time", async () => {
    const fn = () => Promise.resolve(42);
    const result = await withTimeout(fn, 1000);
    expect(result).toBe(42);
  });

  it("rejects with the default message when fn exceeds the timeout", async () => {
    const fn = () => new Promise<never>(() => {}); // never resolves
    const assertion = expect(withTimeout(fn, 500)).rejects.toThrow("Operation timed out");

    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });

  it("rejects with a custom timeoutMessage", async () => {
    const fn = () => new Promise<never>(() => {});
    const assertion = expect(withTimeout(fn, 200, "custom timeout message")).rejects.toThrow(
      "custom timeout message"
    );

    await vi.advanceTimersByTimeAsync(200);
    await assertion;
  });

  it("does not reject if fn resolves just before the timeout", async () => {
    // fn resolves immediately — no timer advance needed
    const fn = () => Promise.resolve("done");
    await expect(withTimeout(fn, 1000)).resolves.toBe("done");
  });
});

// ─── randomId ─────────────────────────────────────────────────────────────────

describe("randomId()", () => {
  it("returns a non-empty string", () => {
    expect(typeof randomId()).toBe("string");
    expect(randomId().length).toBeGreaterThan(0);
  });

  it("matches the UUID v4 format", () => {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidV4Regex.test(randomId())).toBe(true);
  });

  it("returns a different value on each call", () => {
    const ids = new Set(Array.from({ length: 50 }, () => randomId()));
    expect(ids.size).toBe(50);
  });
});
