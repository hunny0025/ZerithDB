export interface ENSResolver {
  resolve(name: string): Promise<string | null>;
}

/**
 * Phase 1: Simple fallback resolver
 * - supports mock ENS mapping
 * - safe for local/dev/testing
 */
export class MockENSResolver implements ENSResolver {
  private readonly map = new Map<string, string>();

  constructor(initial?: Record<string, string>) {
    if (initial) {
      for (const [name, peerId] of Object.entries(initial)) {
        this.map.set(name, peerId);
      }
    }
  }

  async resolve(name: string): Promise<string | null> {
    // Normalize ENS name
    const key = name.trim().toLowerCase();
    return this.map.get(key) ?? null;
  }

  /**
   * Optional helper for tests / local dev
   */
  register(name: string, peerId: string): void {
    this.map.set(name.trim().toLowerCase(), peerId);
  }
}
