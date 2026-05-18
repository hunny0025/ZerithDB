import type { PeerId } from "zerithdb-core";

export interface NameRecord {
  /** Human-readable alias */
  name: string;

  /** Peer ID associated with the alias */
  peerId: PeerId;

  /** Optional ENS name */
  ens?: string;

  /** Ed25519 public key */
  publicKey?: string;

  /** Unix timestamp */
  timestamp: number;

  /** Optional signature for verification */
  signature?: string;
}

/**
 * Lightweight in-memory decentralized name registry.
 *
 * Phase 1:
 * - local registry only
 * - conflict-safe insertion
 * - future-ready for signed announcements
 */
export class NameRegistry {
  private readonly records = new Map<string, NameRecord>();

  register(record: NameRecord): boolean {
    const existing = this.records.get(record.name);

    // Reject conflicting registrations
    if (existing && existing.peerId !== record.peerId) {
      return false;
    }

    this.records.set(record.name, record);
    return true;
  }

  resolve(name: string): NameRecord | undefined {
    return this.records.get(name);
  }

  has(name: string): boolean {
    return this.records.has(name);
  }

  entries(): NameRecord[] {
    return [...this.records.values()];
  }
}
