/**
 * Unique identifier for a document.
 * - UUID v7 string (default — globally unique, sortable by insertion time)
 * - Auto-incrementing integer (opt-in via `{ idStrategy: "autoincrement" }`)
 */
export type DocumentId = string | number;

/** Name of a collection within ZerithDB */
export type CollectionName = string;

/** System fields automatically added to every stored document */
export type DocumentMetadata = {
  _id: DocumentId;
  /** Created-at timestamp in Unix milliseconds */
  _createdAt: number;
  /** Last-updated-at timestamp in Unix milliseconds */
  _updatedAt: number;
};

/** Base document shape. All stored documents have system fields added automatically. */
export type Document<T extends Record<string, any> = Record<string, any>> = T & DocumentMetadata;

type RegexFilter =
  | { $regex: RegExp | string }
  | {
    $regex: RegExp | string;
    /** Regex flags (for example: "i", "gm") */
    $flags?: string;
    /** Alias for $flags for MongoDB-like ergonomics */
    $options?: string;
  };

/**
 * Options passed when opening a collection handle.
 *
 * @example UUID v7 (default)
 * ```ts
 * db.collection("users")
 * ```
 *
 * @example Auto-incrementing integer IDs
 * ```ts
 * db.collection("users", { idStrategy: "autoincrement" })
 * ```
 */
export interface CollectionOptions {
  /**
   * Controls how `_id` values are generated for new documents.
   *
   * - `"uuid"` *(default)* — UUID v7, globally unique and time-sortable.
   *   Safe for distributed / P2P workloads.
   * - `"autoincrement"` — Sequential integers starting at `1`.
   *   Familiar for SQL-style workflows. **Not safe for P2P sync** — IDs
   *   will collide when two peers insert independently.
   */
  idStrategy?: "uuid" | "autoincrement";
}

/**
 * MongoDB-style query filter operators.
 * Nested object fields are matched by equality.
 *
 * @example
 * // Native RegExp
 * { title: { $regex: /meeting/i } }
 *
 * @example
 * // String pattern with flags
 * { title: { $regex: "meeting", $flags: "i" } }
 */
type QueryFilterValue<T> =
  | T
  | { $eq: T }
  | { $ne: T }
  | { $gt: T }
  | { $gte: T }
  | { $lt: T }
  | { $lte: T }
  | { $in: T[] }
  | { $nin: T[] }
  | { $exists: boolean }
  | { $regex: RegExp | string };
  | { $exists: boolean };

/**
 * Query filters can target both user-defined fields and ZerithDB system fields
 * like `_id`, `_createdAt`, and `_updatedAt`.
 */
export type QueryFilter<T extends Record<string, any>> = {
  [K in keyof T]?: QueryFilterValue<T[K]>;
} & {
  _id?: QueryFilterValue<DocumentId>;
  _createdAt?: QueryFilterValue<number>;
  _updatedAt?: QueryFilterValue<number>;
};

/** Partial update spec — only user-defined fields are modified */
export type UpdateSpec<T extends Record<string, any>> = {
  $set?: Partial<T>;
  $unset?: { [K in keyof T]?: true };
};

export type InsertResult = {
  id: DocumentId;
};

export type QueryOptions<T extends Record<string, any> = Record<string, any>> = {
  limit?: number;

  /**
   * Number of matching documents to skip.
   * `offset` is kept for backward compatibility.
   */
  skip?: number;
  offset?: number;

  /**
   * Sort matching documents by field.
   */
  sort?: {
    field: keyof Document<T>;
    order?: "asc" | "desc";
  };
};

export type FindResult<T extends Record<string, any>> = {
  documents: Document<T>[];
  count: number;
};
