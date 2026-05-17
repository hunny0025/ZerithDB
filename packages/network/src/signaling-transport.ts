/**
 * Abstraction over the transport used for signaling communication.
 * Both WebSocket and HTTP long-polling implement this interface,
 * making them interchangeable from the NetworkManager's perspective.
 */
export interface SignalingTransport {
  /** Send a JSON-serialised signaling message */
  send(message: string): void;

  /** Close the transport and release resources */
  close(): void;

  /** Register a handler for incoming messages */
  onMessage(handler: (data: string) => void): void;

  /** Register a handler for transport closure */
  onClose(handler: () => void): void;

  /** Register a handler for transport errors */
  onError(handler: (err: unknown) => void): void;

  /** Whether the transport is currently connected and able to send */
  readonly connected: boolean;
}
