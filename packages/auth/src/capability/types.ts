/**
 * UCAN (User Controlled Authorization Networks) capability types.
 * @see https://github.com/ucan-wg/spec
 */

/** Action that can be performed on a resource. */
export type Action = 'read' | 'write' | 'create' | 'delete' | 'sync';

/** A capability – grants a set of actions on a resource. */
export interface Capability {
  /** Resource URI, e.g., "zerithdb://my-app/todos" or "zerithdb://my-app/todos/doc123" */
  resource: string;
  /** Allowed actions on that resource. */
  actions: Action[];
}

/**
 * UCAN structure (simplified, without `nbf` or `nnc` for v1).
 */
export interface UCAN {
  /** Issuer DID (did:key:...) */
  iss: string;
  /** Audience DID (the delegatee) */
  aud: string;
  /** Array of capabilities being delegated */
  att: Capability[];
  /** Expiration timestamp (seconds since Unix epoch) */
  exp: number;
  /** Proof chain – previous UCANs that authorize this delegation (optional) */
  prf?: UCAN[];
  /** Ed25519 signature (hex-encoded) */
  sig: string;
}

/** Options for delegating capabilities. */
export interface DelegateOptions {
  /** Expiration in seconds from now. Default: 3600 (1 hour). */
  expiresIn?: number;
  /** Proof chain – required if delegating capabilities not directly owned. */
  proof?: UCAN[];
}