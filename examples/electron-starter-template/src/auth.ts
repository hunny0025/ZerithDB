import { db } from "./db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Identity = Awaited<ReturnType<typeof db.auth.signIn>>;

// ---------------------------------------------------------------------------
// Module-level singleton — set once on bootstrap, read everywhere.
// ---------------------------------------------------------------------------

let identity: Identity | null = null;

// ---------------------------------------------------------------------------
// ensureIdentity
// ---------------------------------------------------------------------------
// Call once at app start (before rendering).
//
// - If a keypair already exists in the local store, it is loaded.
// - Otherwise a fresh Ed25519 keypair is generated and persisted.
//
// No network request is made. No server is involved.
// The resulting public key is a W3C DID: "did:key:z6Mk..."

export async function ensureIdentity(): Promise<Identity> {
  identity = await db.auth.signIn();
  console.log("[auth] signed in as:", identity.publicKey);
  return identity;
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function getPublicKey(): string {
  if (!identity) throw new Error("Call ensureIdentity() before getPublicKey()");
  return identity.publicKey;
}

export function getIdentity(): Identity {
  if (!identity) throw new Error("Call ensureIdentity() before getIdentity()");
  return identity;
}
