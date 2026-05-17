import type { AuditEvent } from "./types/audit";
import { webcrypto } from "node:crypto";

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = sortKeys((value as Record<string, unknown>)[key]);

          return acc;
        },
        {} as Record<string, unknown>
      );
  }

  return value;
}

export function canonicalize(data: unknown): string {
  return JSON.stringify(sortKeys(data));
}

export async function sha256(payload: string): Promise<string> {
  const encoder = new TextEncoder();

  const data = encoder.encode(payload);

  const digest = await webcrypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createEventHash(
  event: Omit<AuditEvent, "hash" | "signature">
): Promise<string> {
  const canonical = canonicalize(event);

  return sha256(canonical);
}
