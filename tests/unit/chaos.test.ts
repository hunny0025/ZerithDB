import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";
import { NetworkManager } from "../../packages/network/src/network-manager.js";
import { AuthManager } from "../../packages/auth/src/index.js";
import type { ZerithDBConfig } from "../../packages/core/src/index.js";

// MockWebSocket mimics the signaling WebSocket in-memory
class MockWebSocket extends EventEmitter {
  // Standard WebSocket ready state constants (required by WebSocketTransport)
  public static readonly CONNECTING = 0;
  public static readonly OPEN = 1;
  public static readonly CLOSING = 2;
  public static readonly CLOSED = 3;

  public readyState = 0; // CONNECTING
  public url: string;
  public peerId: string = "";
  public roomId: string = "";

  public static clients = new Map<string, MockWebSocket>();
  public static packetDropRate = 0.0;

  constructor(url: string) {
    super();
    this.url = url;

    const urlObj = new URL(url);
    this.peerId = urlObj.searchParams.get("peer") || "";
    this.roomId = urlObj.searchParams.get("room") || "";

    MockWebSocket.clients.set(this.peerId, this);

    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 5);

    // peer-list is sent after a short delay AFTER open, so that
    // WebSocketTransport.attachTransport() has time to register onMessage handler
    setTimeout(() => {
      const existingPeers = Array.from(MockWebSocket.clients.values())
        .filter((c) => c.roomId === this.roomId && c.peerId !== this.peerId)
        .map((c) => c.peerId);

      const peerListMsg = {
        type: "peer-list",
        from: "server",
        payload: existingPeers,
      };

      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(peerListMsg) } as any);
      }
    }, 20);
  }

  public onopen: (() => void) | null = null;
  public onerror: ((err: any) => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: (() => void) | null = null;

  public send(data: string) {
    if (this.readyState !== 1) {
      throw new Error("WebSocket not open");
    }

    // Packet drop simulation
    if (Math.random() < MockWebSocket.packetDropRate) {
      return; // Dropped!
    }

    const msg = JSON.parse(data);
    const targetPeerId = msg.to;
    if (!targetPeerId) return;

    const targetClient = MockWebSocket.clients.get(targetPeerId);
    if (targetClient && targetClient.readyState === 1) {
      setTimeout(() => {
        if (targetClient.onmessage) {
          targetClient.onmessage({
            data: JSON.stringify({
              type: msg.type,
              from: this.peerId,
              to: targetPeerId,
              payload: msg.payload,
            }),
          } as any);
        }
      }, 2);
    }
  }

  public close() {
    if (this.readyState === 3) return;
    this.readyState = 3; // CLOSED
    MockWebSocket.clients.delete(this.peerId);
    if (this.onclose) this.onclose();
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("Signaling & Network Chaos Engineering", () => {
  let originalWebSocket: any;
  let authManager: AuthManager;
  const config: ZerithDBConfig = {
    appId: "chaos-test",
    sync: {
      signalingUrl: "ws://localhost:8000",
    },
    network: {
      reconnectDelay: 10, // speed up reconnect backoff for testing
      peerCheckInterval: 50, // run health check loop every 50ms for tests
      handshakeTimeout: 100, // speed up handshake timeout to 100ms for tests
    } as any,
  };

  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    global.WebSocket = MockWebSocket as any;
    MockWebSocket.clients.clear();
    MockWebSocket.packetDropRate = 0.0;

    // Minimal auth manager mock
    authManager = {
      getIdentity: () => ({ publicKey: "mock-pub", did: "did:key:mock" }),
    } as any;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  it("should successfully establish a full mesh network in happy path", async () => {
    const manager1 = new NetworkManager(config, authManager);
    const manager2 = new NetworkManager(config, authManager);

    const connectedPromise1 = new Promise<void>((resolve) => manager1.once("peer:connected", () => resolve()));
    const connectedPromise2 = new Promise<void>((resolve) => manager2.once("peer:connected", () => resolve()));

    await manager1.connect("test-room");
    await manager2.connect("test-room");

    // Wait for the WebRTC mock handshake to execute and establish P2P connection cleanly
    await Promise.all([connectedPromise1, connectedPromise2]);

    expect(manager1.connectedPeerCount).toBe(1);
    expect(manager2.connectedPeerCount).toBe(1);

    await manager1.dispose();
    await manager2.dispose();
  });

  it("should handle WebSocket sudden disconnect and reconnect back to the mesh", async () => {
    const manager1 = new NetworkManager(config, authManager);
    await manager1.connect("test-room");

    const clientsBefore = Array.from(MockWebSocket.clients.values());
    expect(clientsBefore).toHaveLength(1);

    // Simulate sudden WebSocket disconnection
    const wsInstance = clientsBefore[0]!;
    wsInstance.close();

    expect(MockWebSocket.clients.size).toBe(0);

    // Wait for the NetworkManager to detect close and reconnect (reconnectDelay is 10ms)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Reconnected!
    expect(MockWebSocket.clients.size).toBe(1);

    await manager1.dispose();
  });

  it("should recover and connect all peers under a 50% packet drop environment", async () => {
    // Enable 50% drop rate of signaling packets during setup
    MockWebSocket.packetDropRate = 0.5;

    const manager1 = new NetworkManager(config, authManager);
    const manager2 = new NetworkManager(config, authManager);

    const connectedPromise1 = new Promise<void>((resolve) => manager1.once("peer:connected", () => resolve()));
    const connectedPromise2 = new Promise<void>((resolve) => manager2.once("peer:connected", () => resolve()));

    await manager1.connect("test-room");
    await manager2.connect("test-room");

    // Wait a brief moment under the high-packet drop environment
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Even if initial handshakes are dropped, turning drop rate to 0
    // should allow the self-healing peer check loop (simulated here) to recover.
    MockWebSocket.packetDropRate = 0.0;

    // Wait for the event-driven connection to cleanly establish via self-healing loop
    await Promise.all([connectedPromise1, connectedPromise2]);

    expect(manager1.connectedPeerCount).toBe(1);
    expect(manager2.connectedPeerCount).toBe(1);

    await manager1.dispose();
    await manager2.dispose();
  });

  it("should self-heal when a WebRTC peer suddenly disconnects mid-session", async () => {
    const manager1 = new NetworkManager(config, authManager);
    const manager2 = new NetworkManager(config, authManager);

    const connectedPromise1 = new Promise<void>((resolve) => manager1.once("peer:connected", () => resolve()));
    const connectedPromise2 = new Promise<void>((resolve) => manager2.once("peer:connected", () => resolve()));

    await manager1.connect("test-room");
    await manager2.connect("test-room");

    await Promise.all([connectedPromise1, connectedPromise2]);

    expect(manager1.connectedPeerCount).toBe(1);

    // Prepare a promise to wait for the self-healing reconnection
    const reconnectPromise = new Promise<void>((resolve) => {
      manager1.once("peer:connected", () => resolve());
    });

    // Get the active MockSimplePeer instance and trigger sudden disconnect
    const peerInstance = (manager1 as any).peers.values().next().value as any;
    expect(peerInstance).toBeDefined();

    // Sudden WebRTC connection drop
    peerInstance.destroy();

    expect(manager1.connectedPeerCount).toBe(0);

    // Wait for the self-healing interval to run and re-establish the connection cleanly
    await reconnectPromise;

    // Healed automatically!
    expect(manager1.connectedPeerCount).toBe(1);

    await manager1.dispose();
    await manager2.dispose();
  });
});
