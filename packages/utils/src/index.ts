/**
 * zerithdb-utils — Internal shared utilities
 * Not for public consumption. Not exported from zerithdb-sdk.
 */

// ─── Type guards ──────────────────────────────────────────────────────────────

/** Type-safe check if a value is a plain object (not null, not array) */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Asserts a value is not null or undefined, throws with a message if it is */
export function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

// ─── Encoding helpers ─────────────────────────────────────────────────────────

/** Convert a Uint8Array to a hex string */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Convert a hex string to a Uint8Array */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string length");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Encode Uint8Array to base64 string */
export function bytesToBase64(bytes: Uint8Array): string {
  // Use chunking to avoid call stack overflow on large arrays (>~100KB)
  const CHUNK_SIZE = 0x4000; // 16KB
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

/** Decode base64 string to Uint8Array */
export function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ─── Async helpers ────────────────────────────────────────────────────────────

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with full jitter — returns delay in ms */
export function backoffDelay(attempt: number, base = 1000, max = 30_000): number {
  const exp = Math.min(base * 2 ** attempt, max);
  return exp / 2 + Math.random() * (exp / 2); // full jitter
}

/** Run an async function with a timeout, rejecting if it exceeds `ms` */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  timeoutMessage = "Operation timed out"
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ]);
}

// ─── ID helpers ───────────────────────────────────────────────────────────────

/** Generate a random UUID v4 */
export function randomId(): string {
  return crypto.randomUUID();
}
