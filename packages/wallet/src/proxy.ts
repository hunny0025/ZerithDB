import type { IAuthManager, Identity, Signature, ZerithDBConfig, AuthEvents } from "zerithdb-core";
import { EventEmitter } from "zerithdb-core";
import type { WalletRequest, WalletResponse, WalletMessageType, PickFileParams, PickedFile } from "./types.js";

/**
 * WalletProxy acts as a surrogate for AuthManager in the SDK.
 * It communicates with a shared Wallet Iframe via postMessage.
 */
export class WalletProxy extends EventEmitter<AuthEvents> implements IAuthManager {
  private iframe: HTMLIFrameElement | null = null;
  private walletUrl: string;
  private walletOrigin: string;
  private appId: string;
  private _identity: Identity | null = null;
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
  private isReady = false;

  constructor(config: ZerithDBConfig) {
    super();
    if (!config.auth?.walletUrl) {
      throw new Error("WalletProxy requires auth.walletUrl in config");
    }
    this.walletUrl = config.auth.walletUrl;
    this.walletOrigin = new URL(this.walletUrl).origin;
    this.appId = config.appId;
    this.initIframe();
    this.setupListeners();
  }

  private initIframe(): void {
    if (typeof window === "undefined") return;

    this.iframe = document.createElement("iframe");
    this.iframe.src = this.walletUrl;
    this.iframe.style.display = "none";
    this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    document.body.appendChild(this.iframe);
  }

  private setupListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("message", async (event) => {
      // Security: Validate origin
      if (event.origin !== this.walletOrigin) return;

      const data = event.data;

      // Handle wallet readiness
      if (data.type === "WALLET_READY") {
        this.isReady = true;
        // Attempt to fetch existing identity
        try {
          this._identity = await this.request<Identity>("WALLET_GET_IDENTITY");
          if (this._identity) {
            this.emit("identity:change", this._identity);
          }
        } catch (err) {
          // No active session or error
          console.warn("[WalletProxy] Could not fetch existing identity on ready:", err);
        }
        return;
      }

      // Handle responses to requests
      const response = data as WalletResponse;
      if (response.id && this.pendingRequests.has(response.id)) {
        const { resolve, reject } = this.pendingRequests.get(response.id)!;
        this.pendingRequests.delete(response.id);

        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.payload);
        }
      }
    });
  }

  private async request<T>(type: WalletMessageType, payload?: unknown): Promise<T> {
    const id = Math.random().toString(36).slice(2);
    const request: WalletRequest = { id, type, payload, appId: this.appId };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`[WalletProxy] Request timeout for type: ${type}`));
      }, 10000); // 10 seconds timeout

      this.pendingRequests.set(id, { 
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        }, 
        reject: (reason) => {
          clearTimeout(timeout);
          reject(reason);
        } 
      });

      try {
        if (!this.iframe?.contentWindow) {
          throw new Error("Iframe content window is not available");
        }
        this.iframe.contentWindow.postMessage(request, this.walletOrigin);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        console.error(`[WalletProxy] Error posting message for ${type}:`, error);
        reject(error);
      }
    });
  }

  async signIn(): Promise<Identity> {
    this._identity = await this.request<Identity>("WALLET_SIGN_IN");
    this.emit("identity:change", this._identity);
    return this._identity;
  }

  signOut(): void {
    this._identity = null;
    this.emit("identity:change", null);
    this.request("WALLET_SIGN_OUT"); // Fire and forget
  }

  async sign(data: Uint8Array): Promise<Signature> {
    // Note: TypedArrays cannot be directly sent via postMessage easily in some cases
    // but modern browsers handle it fine. For widest compatibility we might hex-encode.
    return this.request<Signature>("WALLET_SIGN", data);
  }

  async verify(data: Uint8Array, signature: Signature, publicKey: string): Promise<boolean> {
    // Verification doesn't need the private key, so we could do it locally
    // but for consistency we can also proxy it or use a separate helper.
    return this.request<boolean>("WALLET_VERIFY", { data, signature, publicKey });
  }

  async pickFile(params?: PickFileParams): Promise<PickedFile | null> {
    return this.request<PickedFile | null>("WALLET_PICK_FILE", params);
  }

  get identity(): Identity | null {
    return this._identity;
  }
}
