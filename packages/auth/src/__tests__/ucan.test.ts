import { describe, it, expect, beforeAll } from 'vitest';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { signUCAN, verifyUCAN, verifyDelegationChain } from '../capability/ucan.js';
import type { UCAN } from '../capability/types.js';

// Initialize noble/ed25519 with sha512
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

describe('UCAN', () => {
  let alicePrivateKey: Uint8Array;
  let alicePublicKey: Uint8Array;
  let aliceDid: string;
  let bobPrivateKey: Uint8Array;
  let bobPublicKey: Uint8Array;
  let bobDid: string;

  beforeAll(async () => {
    // Generate Alice's keypair
    alicePrivateKey = ed.utils.randomPrivateKey();
    alicePublicKey = await ed.getPublicKeyAsync(alicePrivateKey);
    aliceDid = `did:key:${bytesToHex(alicePublicKey)}`;

    // Generate Bob's keypair
    bobPrivateKey = ed.utils.randomPrivateKey();
    bobPublicKey = await ed.getPublicKeyAsync(bobPrivateKey);
    bobDid = `did:key:${bytesToHex(bobPublicKey)}`;
  });

  it('should sign and verify a UCAN', async () => {
    const ucanWithoutSig: Omit<UCAN, 'sig'> = {
      iss: aliceDid,
      aud: bobDid,
      att: [{ resource: 'zerithdb://app/todos', actions: ['read'] }],
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const ucan = await signUCAN(ucanWithoutSig, alicePrivateKey);
    expect(ucan.sig).toBeDefined();
    expect(typeof ucan.sig).toBe('string');

    const isValid = await verifyUCAN(ucan, bobDid);
    expect(isValid).toBe(true);
  });

  it('should reject expired UCAN', async () => {
    const ucanWithoutSig: Omit<UCAN, 'sig'> = {
      iss: aliceDid,
      aud: bobDid,
      att: [{ resource: 'zerithdb://app/todos', actions: ['read'] }],
      exp: Math.floor(Date.now() / 1000) - 1, // expired
    };
    const ucan = await signUCAN(ucanWithoutSig, alicePrivateKey);
    const isValid = await verifyUCAN(ucan);
    expect(isValid).toBe(false);
  });

  it('should reject wrong audience', async () => {
    const ucanWithoutSig: Omit<UCAN, 'sig'> = {
      iss: aliceDid,
      aud: bobDid,
      att: [],
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const ucan = await signUCAN(ucanWithoutSig, alicePrivateKey);
    // Expect audience to be bobDid, but we verify with a different DID
    const isValid = await verifyUCAN(ucan, 'did:key:wrong');
    expect(isValid).toBe(false);
  });

  it('should verify a delegation chain (root → alice → bob)', async () => {
    // Root (owner) keypair – for this test, we treat Alice as root
    const rootDid = aliceDid;
    const rootPrivateKey = alicePrivateKey;

    // Alice delegates to Bob
    const delegateUcanWithoutSig: Omit<UCAN, 'sig'> = {
      iss: rootDid,
      aud: bobDid,
      att: [{ resource: 'zerithdb://app/todos', actions: ['read', 'write'] }],
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const delegateUcan = await signUCAN(delegateUcanWithoutSig, rootPrivateKey);

    // Bob delegates to Charlie (we need a third key)
    const charliePrivateKey = ed.utils.randomPrivateKey();
    const charliePublicKey = await ed.getPublicKeyAsync(charliePrivateKey);
    const charlieDid = `did:key:${bytesToHex(charliePublicKey)}`;

    const subDelegateUcanWithoutSig: Omit<UCAN, 'sig'> = {
      iss: bobDid,
      aud: charlieDid,
      att: [{ resource: 'zerithdb://app/todos', actions: ['read'] }], // attenuated: only read
      exp: Math.floor(Date.now() / 1000) + 3600,
      prf: [delegateUcan], // proof chain includes Alice's delegation to Bob
    };
    const subDelegateUcan = await signUCAN(subDelegateUcanWithoutSig, bobPrivateKey);

    // Verify the whole chain starting from root (Alice)
    const isValid = await verifyDelegationChain(subDelegateUcan, rootDid);
    expect(isValid).toBe(true);
  });

  it('should reject a delegation chain where capability is expanded (not attenuated)', async () => {
    const rootDid = aliceDid;
    const rootPrivateKey = alicePrivateKey;

    // Alice delegates read-only to Bob
    const delegateUcanWithoutSig: Omit<UCAN, 'sig'> = {
      iss: rootDid,
      aud: bobDid,
      att: [{ resource: 'zerithdb://app/todos', actions: ['read'] }], // only read
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const delegateUcan = await signUCAN(delegateUcanWithoutSig, rootPrivateKey);

    // Bob tries to delegate write (which he doesn't have) to Charlie
    const charliePrivateKey = ed.utils.randomPrivateKey();
    const charliePublicKey = await ed.getPublicKeyAsync(charliePrivateKey);
    const charlieDid = `did:key:${bytesToHex(charliePublicKey)}`;

    const subDelegateUcanWithoutSig: Omit<UCAN, 'sig'> = {
      iss: bobDid,
      aud: charlieDid,
      att: [{ resource: 'zerithdb://app/todos', actions: ['write'] }], // write not allowed
      exp: Math.floor(Date.now() / 1000) + 3600,
      prf: [delegateUcan],
    };
    const subDelegateUcan = await signUCAN(subDelegateUcanWithoutSig, bobPrivateKey);

    const isValid = await verifyDelegationChain(subDelegateUcan, rootDid);
    expect(isValid).toBe(false);
  });
});