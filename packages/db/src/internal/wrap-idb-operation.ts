import { ZerithDBError, ErrorCode } from "zerithdb-core";

/**
 * Wraps an IndexedDB/Dexie operation to preserve the caller's stack trace.
 *
 * IDB errors are thrown inside async event callbacks, which means the stack
 * trace normally shows only browser/Dexie internals — not the line in user
 * code that triggered the operation. By capturing a stack snapshot BEFORE
 * the awaited call, we can attach the caller's context to any error thrown.
 *
 * @param code    - The ZerithDB ErrorCode to use if the operation fails
 * @param message - Human-readable error message
 * @param fn      - The async IDB operation to execute
 */
export async function wrapIDBOperation<T>(
  code: ErrorCode,
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  // Capture caller stack NOW — before going async into IDB
  const callerStack = new Error().stack ?? "";

  try {
    return await fn();
  } catch (err) {
    const error = new ZerithDBError(code, message, { cause: err });

    // Append the caller's stack so DevTools shows where in user code
    // this operation was triggered — not just Dexie/IDB internals
    if (callerStack) {
      error.stack = `${error.stack ?? ""}\n--- Captured caller stack ---\n${callerStack}`;
    }

    throw error;
  }
}
