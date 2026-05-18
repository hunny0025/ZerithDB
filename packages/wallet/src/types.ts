import type { Identity, Signature } from "zerithdb-core";

/**
 * Message types for SDK-to-Wallet communication
 */
export type WalletMessageType =
  | "WALLET_READY"
  | "WALLET_HANDSHAKE"
  | "WALLET_SIGN_IN"
  | "WALLET_SIGN_OUT"
  | "WALLET_SIGN"
  | "WALLET_VERIFY"
  | "WALLET_GET_IDENTITY"
  | "WALLET_PICK_FILE";

/**
 * Request sent from SDK to Wallet Iframe
 */
export interface WalletRequest<T = unknown> {
  id: string;
  type: WalletMessageType;
  payload?: T;
  appId: string;
}

/**
 * Response sent from Wallet Iframe back to SDK
 */
export interface WalletResponse<T = unknown> {
  id: string;
  type: WalletMessageType;
  payload?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Payload for WALLET_PICK_FILE
 */
export interface PickFileParams {
  collection?: string;
  filter?: unknown;
  title?: string;
}

/**
 * Result of WALLET_PICK_FILE
 */
export interface PickedFile {
  collection: string;
  id: string;
  data: unknown;
}
