import type { DocumentRef, HydratedRef } from "./types";

export function ref(collection: string, id: string): DocumentRef {
  if (!collection || typeof collection !== "string") {
    throw new Error("[zerithdb-refs] ref(): collection must be a non-empty string.");
  }
  if (!id || typeof id !== "string") {
    throw new Error("[zerithdb-refs] ref(): id must be a non-empty string.");
  }
  return { __ref: true, collection, id, createdAt: new Date().toISOString() };
}

export function isRef(value: unknown): value is DocumentRef {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as DocumentRef).__ref === true &&
    !(value as HydratedRef).__hydrated
  );
}

export function isHydrated<T extends Record<string, unknown>>(
  value: unknown
): value is HydratedRef<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as HydratedRef).__ref === true &&
    (value as HydratedRef).__hydrated === true
  );
}

export function extractRefs(
  doc: Record<string, unknown>,
  prefix = ""
): Array<{ fieldPath: string; ref: DocumentRef }> {
  const results: Array<{ fieldPath: string; ref: DocumentRef }> = [];
  for (const [key, value] of Object.entries(doc)) {
    const path = prefix ? prefix + "." + key : key;
    if (isRef(value)) {
      results.push({ fieldPath: path, ref: value });
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      results.push(...extractRefs(value as Record<string, unknown>, path));
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (isRef(item)) results.push({ fieldPath: path + "[" + idx + "]", ref: item });
      });
    }
  }
  return results;
}
