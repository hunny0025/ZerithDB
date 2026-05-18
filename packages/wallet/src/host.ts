import { AuthManager } from "zerithdb-auth";
import type { WalletRequest, WalletResponse, WalletMessageType } from "./types.js";
import type { ZerithDBConfig } from "zerithdb-core";

/**
 * The WalletHost runs inside a shared iframe.
 * It manages identities and handles requests from SDK instances across different origins.
 */
export class WalletHost {
  private auth: AuthManager;
  private allowedOrigins: Set<string>;

  constructor(config: ZerithDBConfig, allowedOrigins: string[] = []) {
    this.auth = new AuthManager(config);
    this.allowedOrigins = new Set(allowedOrigins);
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener("message", async (event) => {
      // Security: Validate origin
      if (!this.isOriginAllowed(event.origin)) return;

      const request = event.data as WalletRequest;
      if (!request || !request.type || !request.id) return;

      await this.handleRequest(request, event.origin, event.source as Window);
    });

    // Notify parent that wallet is ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: "WALLET_READY" }, "*");
    }
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.allowedOrigins.has("*")) {
      console.warn("[WalletHost] Warning: Wildcard '*' origin is allowed. This is insecure.");
      return true;
    }
    return this.allowedOrigins.has(origin);
  }

  private async handleRequest(
    request: WalletRequest,
    origin: string,
    source: Window
  ): Promise<void> {
    try {
      let result: unknown;

      switch (request.type) {
        case "WALLET_HANDSHAKE":
          result = { status: "ok", appId: request.appId };
          break;

        case "WALLET_SIGN_IN":
          result = await this.auth.signIn();
          break;

        case "WALLET_GET_IDENTITY":
          result = this.auth.identity;
          break;

        case "WALLET_SIGN":
          result = await this.auth.sign(request.payload as Uint8Array);
          break;

        case "WALLET_SIGN_OUT":
          this.auth.signOut();
          result = { status: "ok" };
          break;

        case "WALLET_VERIFY": {
          const { data, signature, publicKey } = request.payload as {
            data: Uint8Array;
            signature: string;
            publicKey: string;
          };
          result = await this.auth.verify(data, signature, publicKey);
          break;
        }

        case "WALLET_PICK_FILE":
          result = await this.handlePickFile(request.payload);
          break;

        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      this.sendResponse(source, origin, {
        id: request.id,
        type: request.type,
        payload: result,
      });
    } catch (err: any) {
      this.sendResponse(source, origin, {
        id: request.id,
        type: request.type,
        error: {
          code: "WALLET_ERROR",
          message: err.message,
        },
      });
    }
  }

  private async handlePickFile(payload: unknown): Promise<unknown> {
    console.log("[WalletHost] Opening Universal File Picker UI...", payload);

    // In a real implementation, this would show a React/HTML modal overlay
    // that lets the user browse their local ZerithDB databases.

    // Mocking user selection logic:
    return new Promise((resolve) => {
      // Simulate user clicking a file after 1 second
      setTimeout(() => {
        resolve({
          collection: (payload as Record<string, unknown>)?.collection ?? "shared_files",
          id: "picked-file-123",
          data: {
            title: "Mock Selected File",
            content: "This data was picked via the ZerithDB Universal File Picker!",
            origin: "zerithdb-wallet",
          },
        });
      }, 500);
    });
  }

  private sendResponse(source: Window, origin: string, response: WalletResponse): void {
    source.postMessage(response, origin);
  }
}
