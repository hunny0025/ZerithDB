import type { SyncProtocol } from "zerithdb-core";

/**
 * Default ZerithDB sync protocol.
 * 
 * This class handles the encoding and decoding of synchronization messages
 * used in the ZerithDB distributed system. It defines how data updates
 * (such as document changes) are serialized for transmission over the network.
 * 
 * Encodes messages as: [nameLen (1 byte)] + [collectionName (N bytes)] + [yjsUpdate (M bytes)]
 * Payload is base64 encoded for transmission.
 */
export class DefaultSyncProtocol implements SyncProtocol {
  /** The unique identifier for this protocol version. */
  readonly name = "default";
  
  /** The current version of the protocol. */
  readonly version = "1.0.0";

  /**
   * Encodes a collection name and its corresponding update data into a Base64 string.
   * 
   * The encoding format consists of:
   * 1. A 1-byte header specifying the length of the collection name.
   * 2. The collection name encoded as UTF-8 bytes.
   * 3. The actual update data.
   * 
   * @param collectionName - The name of the document collection being updated.
   * @param update - The raw byte array representing the update payload.
   * @returns A Base64 encoded string representing the entire combined message.
   */
  encode(collectionName: string, update: Uint8Array): string {
    const nameBytes = new TextEncoder().encode(collectionName);
    const header = new Uint8Array([nameBytes.length]);
    const combined = new Uint8Array(1 + nameBytes.length + update.length);
    combined.set(header, 0);
    combined.set(nameBytes, 1);
    combined.set(update, 1 + nameBytes.length);
    return bytesToBase64(combined);
  }

  /**
   * Decodes a previously encoded sync message back into its collection name and update payload.
   * 
   * @param data - The received data, either as a Base64 string or raw Uint8Array.
   * @returns An object containing the extracted `collectionName` and `update` array,
   *          or `null` if the decoding fails or the data is malformed.
   */
  decode(data: string | Uint8Array): { collectionName: string; update: Uint8Array } | null {
    try {
      const bytes = typeof data === "string" ? base64ToBytes(data) : data;
      const nameLen = bytes[0];
      if (nameLen === undefined) return null;
      const nameBytes = bytes.slice(1, 1 + nameLen);
      const update = bytes.slice(1 + nameLen);
      return {
        collectionName: new TextDecoder().decode(nameBytes),
        update,
      };
    } catch (error) {
      console.error("[SyncProtocol] Failed to decode sync message:", error);
      return null;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a Uint8Array representation into a Base64 encoded string.
 * 
 * @param bytes - The input byte array to encode.
 * @returns The resulting Base64 string.
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Parses a Base64 encoded string back into a Uint8Array.
 * 
 * @param b64 - The input Base64 string.
 * @returns The decoded byte array.
 */
function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
