import { describe, it, expect } from "vitest";
import { ZerithDBError, ErrorCode } from "zerithdb-core";
import { wrapIDBOperation } from "../internal/wrap-idb-operation.js";

describe("wrapIDBOperation", () => {
  it("returns the result of a successful operation", async () => {
    const result = await wrapIDBOperation(
      ErrorCode.DB_READ_FAILED,
      "should not fail",
      async () => 42
    );
    expect(result).toBe(42);
  });

  it("throws a ZerithDBError when the operation fails", async () => {
    const error = await wrapIDBOperation(ErrorCode.DB_WRITE_FAILED, "insert failed", async () => {
      throw new Error("IDB internal error");
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ZerithDBError);
  });

  it("sets the correct ErrorCode on the thrown error", async () => {
    const error = await wrapIDBOperation(ErrorCode.DB_WRITE_FAILED, "insert failed", async () => {
      throw new Error("IDB internal error");
    }).catch((e: unknown) => e);

    expect((error as ZerithDBError).code).toBe(ErrorCode.DB_WRITE_FAILED);
  });

  it("preserves the original error as cause", async () => {
    const original = new Error("original IDB error");
    const error = await wrapIDBOperation(ErrorCode.DB_READ_FAILED, "read failed", async () => {
      throw original;
    }).catch((e: unknown) => e);

    expect((error as ZerithDBError).cause).toBe(original);
  });

  it("attaches caller stack trace to the error", async () => {
    const error = await wrapIDBOperation(ErrorCode.DB_DELETE_FAILED, "delete failed", async () => {
      throw new Error("IDB error");
    }).catch((e: unknown) => e);

    expect((error as ZerithDBError).stack).toContain("Captured caller stack");
  });
});
