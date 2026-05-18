import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { UCAN, Capability, Action } from './types.js';
import { ZerithDBError, ErrorCode } from 'zerithdb-core';

// Ensure noble's async methods work
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

/**
 * Normalize a UCAN for signing – deterministic JSON string.
 */
export function normalizeUCAN(ucan: Omit<UCAN, 'sig'>): string {
  return JSON.stringify(ucan, Object.keys(ucan).sort());
}

/**
 * Sign a UCAN using an Ed25519 private key (Uint8Array).
 */
export async function signUCAN(
  ucan: Omit<UCAN, 'sig'>,
  privateKeyBytes: Uint8Array
): Promise<UCAN> {
  const normalized = normalizeUCAN(ucan);
  const encoder = new TextEncoder();
  const signature = await ed.signAsync(encoder.encode(normalized), privateKeyBytes);
  const sig = bytesToHex(signature);
  return { ...ucan, sig };
}

/**
 * Verify a UCAN's signature and expiration.
 * @param expectedAudience If provided, must match UCAN's `aud`.
 */
export async function verifyUCAN(
  ucan: UCAN,
  expectedAudience?: string
): Promise<boolean> {
  // Check expiration
  if (ucan.exp < Math.floor(Date.now() / 1000)) return false;
  // Check audience
  if (expectedAudience && ucan.aud !== expectedAudience) return false;

  const { sig, ...ucanWithoutSig } = ucan;
  const normalized = normalizeUCAN(ucanWithoutSig);
  const encoder = new TextEncoder();
  const publicKeyBytes = hexToBytes(extractPublicKeyFromDid(ucan.iss));

  try {
    return await ed.verifyAsync(
      hexToBytes(sig),
      encoder.encode(normalized),
      publicKeyBytes
    );
  } catch {
    return false;
  }
}

/**
 * Verify a full delegation chain.
 */
export async function verifyDelegationChain(
  ucan: UCAN,
  rootPublicKeyDid: string
): Promise<boolean> {
  // No proof chain – issuer must be the root
  if (!ucan.prf || ucan.prf.length === 0) {
    return ucan.iss === rootPublicKeyDid && (await verifyUCAN(ucan));
  }

  // Recursively verify the first proof
  const proof = ucan.prf[0];
  if (!(await verifyDelegationChain(proof, rootPublicKeyDid))) return false;

  // Issuer of this UCAN must equal audience of the proof
  if (ucan.iss !== proof.aud) return false;

  // Attenuation check: each capability must be a subset of the proof's capabilities
  for (const cap of ucan.att) {
    const matchingProofCap = proof.att.find(p => p.resource === cap.resource);
    if (!matchingProofCap) return false;
    if (!cap.actions.every(a => matchingProofCap.actions.includes(a))) return false;
  }

  return await verifyUCAN(ucan);
}

/**
 * Extract capabilities from a verified UCAN.
 */
export function extractCapabilities(ucan: UCAN): Capability[] {
  return [...ucan.att];
}

/**
 * Check if a capability allows a specific action on a resource.
 * Supports exact match or collection‑wide wildcard (`/*` suffix).
 */
export function allowsAction(
  capability: Capability,
  resource: string,
  action: Action
): boolean {
  if (!capability.actions.includes(action)) return false;
  if (capability.resource === resource) return true;
  if (capability.resource.endsWith('/*') && resource.startsWith(capability.resource.slice(0, -2))) {
    return true;
  }
  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Extract the raw public key hex from a did:key string.
 * Simplified for now – assumes the DID contains a hex‑encoded public key after 'did:key:'.
 * In production, use proper multibase decoding (e.g., bs58).
 */
function extractPublicKeyFromDid(did: string): string {
  // Remove "did:key:" prefix; remainder is assumed to be hex (for testing)
  // Replace with actual multibase decoding if needed.
  return did.slice(8);
}