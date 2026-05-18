import { describe, it, expect } from "vitest";
import { ZerithDBError, ErrorCode } from "zerithdb-errors";

// ─── ErrorCode ────────────────────────────────────────────────────────────────

describe("ErrorCode", () => {
  it("exposes DB error codes", () => {
    expect(ErrorCode.DB_INIT_FAILED).toBe("DB_INIT_FAILED");
    expect(ErrorCode.DB_WRITE_FAILED).toBe("DB_WRITE_FAILED");
    expect(ErrorCode.DB_READ_FAILED).toBe("DB_READ_FAILED");
    expect(ErrorCode.DB_DELETE_FAILED).toBe("DB_DELETE_FAILED");
    expect(ErrorCode.DB_MIGRATION_FAILED).toBe("DB_MIGRATION_FAILED");
    expect(ErrorCode.DB_QUOTA_EXCEEDED).toBe("DB_QUOTA_EXCEEDED");
  });

  it("exposes Sync error codes", () => {
    expect(ErrorCode.SYNC_INIT_FAILED).toBe("SYNC_INIT_FAILED");
    expect(ErrorCode.SYNC_APPLY_FAILED).toBe("SYNC_APPLY_FAILED");
    expect(ErrorCode.SYNC_ENCODE_FAILED).toBe("SYNC_ENCODE_FAILED");
  });

  it("exposes Network error codes", () => {
    expect(ErrorCode.NETWORK_SIGNALING_FAILED).toBe("NETWORK_SIGNALING_FAILED");
    expect(ErrorCode.NETWORK_PEER_TIMEOUT).toBe("NETWORK_PEER_TIMEOUT");
    expect(ErrorCode.NETWORK_PEER_DISCONNECTED).toBe("NETWORK_PEER_DISCONNECTED");
    expect(ErrorCode.NETWORK_WEBRTC_FAILED).toBe("NETWORK_WEBRTC_FAILED");
  });

  it("exposes Auth error codes", () => {
    expect(ErrorCode.AUTH_KEY_GENERATION_FAILED).toBe("AUTH_KEY_GENERATION_FAILED");
    expect(ErrorCode.AUTH_SIGN_FAILED).toBe("AUTH_SIGN_FAILED");
    expect(ErrorCode.AUTH_VERIFY_FAILED).toBe("AUTH_VERIFY_FAILED");
    expect(ErrorCode.AUTH_INVALID_SIGNATURE).toBe("AUTH_INVALID_SIGNATURE");
    expect(ErrorCode.AUTH_KEY_NOT_FOUND).toBe("AUTH_KEY_NOT_FOUND");
  });

  it("exposes SDK/config error codes", () => {
    expect(ErrorCode.SDK_INVALID_CONFIG).toBe("SDK_INVALID_CONFIG");
    expect(ErrorCode.SDK_NOT_INITIALIZED).toBe("SDK_NOT_INITIALIZED");
  });
});

// ─── ZerithDBError — construction ─────────────────────────────────────────────

describe("ZerithDBError — construction", () => {
  it("sets name to 'ZerithDBError'", () => {
    const err = new ZerithDBError(ErrorCode.DB_WRITE_FAILED, "write failed");
    expect(err.name).toBe("ZerithDBError");
  });

  it("sets the code field to the provided ErrorCode", () => {
    const err = new ZerithDBError(ErrorCode.SYNC_APPLY_FAILED, "sync broke");
    expect(err.code).toBe(ErrorCode.SYNC_APPLY_FAILED);
  });

  it("sets the message field correctly", () => {
    const err = new ZerithDBError(ErrorCode.AUTH_KEY_NOT_FOUND, "no key found");
    expect(err.message).toBe("no key found");
  });

  it("cause is undefined when options are not provided", () => {
    const err = new ZerithDBError(ErrorCode.DB_READ_FAILED, "read error");
    expect(err.cause).toBeUndefined();
  });

  it("supports cause chaining via ErrorOptions", () => {
    const cause = new TypeError("original error");
    const err = new ZerithDBError(ErrorCode.DB_READ_FAILED, "wrapped", { cause });
    expect(err.cause).toBe(cause);
    expect((err.cause as Error).message).toBe("original error");
  });

  it("supports nested ZerithDBError as cause", () => {
    const inner = new ZerithDBError(ErrorCode.NETWORK_WEBRTC_FAILED, "webrtc failed");
    const outer = new ZerithDBError(ErrorCode.SYNC_INIT_FAILED, "sync init failed", {
      cause: inner,
    });
    expect((outer.cause as ZerithDBError).code).toBe(ErrorCode.NETWORK_WEBRTC_FAILED);
  });
});

// ─── ZerithDBError — prototype chain ─────────────────────────────────────────

describe("ZerithDBError — prototype chain", () => {
  it("is instanceof Error", () => {
    const err = new ZerithDBError(ErrorCode.SDK_INVALID_CONFIG, "bad config");
    expect(err).toBeInstanceOf(Error);
  });

  it("is instanceof ZerithDBError", () => {
    const err = new ZerithDBError(ErrorCode.SDK_INVALID_CONFIG, "bad config");
    expect(err).toBeInstanceOf(ZerithDBError);
  });

  it("instanceof check holds after re-throw", () => {
    let caught: unknown;
    try {
      throw new ZerithDBError(ErrorCode.DB_QUOTA_EXCEEDED, "quota exceeded");
    } catch (e) {
      caught = e;
    }
    expect(caught instanceof ZerithDBError).toBe(true);
    expect(caught instanceof Error).toBe(true);
  });

  it("can be caught as a plain Error", () => {
    expect(() => {
      throw new ZerithDBError(ErrorCode.AUTH_SIGN_FAILED, "signing failed");
    }).toThrow(Error);
  });

  it("can be matched by message in toThrow()", () => {
    expect(() => {
      throw new ZerithDBError(ErrorCode.NETWORK_PEER_TIMEOUT, "peer timed out");
    }).toThrow("peer timed out");
  });
});

// ─── ZerithDBError — toString() ───────────────────────────────────────────────

describe("ZerithDBError — toString()", () => {
  it("follows the format 'ZerithDBError [CODE]: message'", () => {
    const err = new ZerithDBError(ErrorCode.SYNC_ENCODE_FAILED, "encode error");
    expect(err.toString()).toBe("ZerithDBError [SYNC_ENCODE_FAILED]: encode error");
  });

  it("includes the correct code for every error category (spot-checks)", () => {
    const cases: Array<[ErrorCode, string]> = [
      [ErrorCode.DB_MIGRATION_FAILED, "DB_MIGRATION_FAILED"],
      [ErrorCode.NETWORK_PEER_DISCONNECTED, "NETWORK_PEER_DISCONNECTED"],
      [ErrorCode.AUTH_VERIFY_FAILED, "AUTH_VERIFY_FAILED"],
      [ErrorCode.SDK_NOT_INITIALIZED, "SDK_NOT_INITIALIZED"],
    ];
    for (const [code, codeStr] of cases) {
      const err = new ZerithDBError(code, "msg");
      expect(err.toString()).toContain(codeStr);
    }
  });

  it("toString() output contains the message", () => {
    const err = new ZerithDBError(ErrorCode.AUTH_INVALID_SIGNATURE, "bad signature detected");
    expect(err.toString()).toContain("bad signature detected");
  });

  it("toString() with an empty message still includes the code", () => {
    const err = new ZerithDBError(ErrorCode.DB_INIT_FAILED, "");
    expect(err.toString()).toContain("DB_INIT_FAILED");
  });
});
