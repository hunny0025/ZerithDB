import type { SignalingTransport } from "../signaling-transport.js";

/**
 * WebSocket-based signaling transport.
 * Extracts the existing raw WebSocket logic from NetworkManager
 * into a standalone SignalingTransport implementation.
 */
export class WebSocketTransport implements SignalingTransport {
  private ws: WebSocket | null = null;
  private _connected = false;
  private messageHandler: ((data: string) => void) | null = null;
  private closeHandler: (() => void) | null = null;
  private errorHandler: ((err: unknown) => void) | null = null;

  get connected(): boolean {
    return this._connected;
  }

  /**
   * Open a WebSocket connection to the signaling server.
   * Resolves when the connection is established, rejects on error or timeout.
   *
   * @param url - Full WebSocket URL including query parameters
   * @param timeoutMs - Connection timeout in milliseconds
   */
  connect(url: string, timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.close();
          reject(new Error(`WebSocket connection timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        clearTimeout(timer);
        settled = true;
        reject(err);
        return;
      }

      this.ws.onopen = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          this._connected = true;
          resolve();
        }
      };

      this.ws.onerror = (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        } else {
          this.errorHandler?.(err);
        }
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        this.messageHandler?.(event.data);
      };

      this.ws.onclose = () => {
        this._connected = false;
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error("WebSocket closed before connection was established"));
        } else {
          this.closeHandler?.();
        }
      };
    });
  }

  send(message: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  close(): void {
    this._connected = false;
    if (this.ws !== null) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: (data: string) => void): void {
    this.messageHandler = handler;
  }

  onClose(handler: () => void): void {
    this.closeHandler = handler;
  }

  onError(handler: (err: unknown) => void): void {
    this.errorHandler = handler;
  }
}
