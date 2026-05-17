import { describe, expect, it } from "vitest";
import type { ZerithDBConfig } from "zerithdb-core";
import { EventEmitter } from "zerithdb-core";
import type { NetworkManager } from "zerithdb-network";
import { EphemeralStateManager } from "./ephemeral-state.js";

type FakeNetworkEvents = {
  message: { type: string; payload: Uint8Array | string; from: string };
};

class FakeNetwork extends EventEmitter<FakeNetworkEvents> {
  readonly sent: Array<{ type: string; payload: string | Uint8Array }> = [];

  constructor(readonly peerId: string) {
    super();
  }

  broadcast(message: { type: string; payload: string | Uint8Array }): void {
    this.sent.push(message);
  }
}

const config: ZerithDBConfig = {
  appId: "ephemeral-test",
  sync: {
    ephemeral: {
      throttleMs: 0,
      staleAfterMs: 30_000,
      cleanupIntervalMs: 60_000,
    },
  },
};

describe("EphemeralStateManager", () => {
  it("broadcasts local state without persistence or CRDT encoding", () => {
    const network = new FakeNetwork("peer-a");
    const manager = new EphemeralStateManager(config, network as unknown as NetworkManager);
    manager.enable();

    manager.patchLocalState({ muted: { audio: true } }, { immediate: true });

    expect(network.sent).toHaveLength(1);
    expect(network.sent[0]?.type).toBe("ephemeral");
    const payload = JSON.parse(network.sent[0]?.payload as string) as {
      peerId: string;
      sequence: number;
      state: Record<string, unknown>;
    };
    expect(payload.peerId).toBe("peer-a");
    expect(payload.sequence).toBe(1);
    expect(payload.state).toEqual({ muted: { audio: true } });

    manager.dispose();
  });

  it("applies newer remote states and ignores stale sequence numbers", () => {
    const network = new FakeNetwork("peer-a");
    const manager = new EphemeralStateManager(config, network as unknown as NetworkManager);
    manager.enable();

    network.emit("message", {
      type: "ephemeral",
      from: "peer-b",
      payload: JSON.stringify({
        peerId: "peer-b",
        sequence: 2,
        updatedAt: 100,
        state: { activeSpeaker: { peerId: "peer-b" } },
      }),
    });
    network.emit("message", {
      type: "ephemeral",
      from: "peer-b",
      payload: JSON.stringify({
        peerId: "peer-b",
        sequence: 1,
        updatedAt: 101,
        state: { activeSpeaker: { peerId: "peer-c" } },
      }),
    });

    expect(manager.getPeerState("peer-b")?.state).toEqual({
      activeSpeaker: { peerId: "peer-b" },
    });

    manager.dispose();
  });

  it("removes remote states when a tombstone arrives", () => {
    const network = new FakeNetwork("peer-a");
    const manager = new EphemeralStateManager(config, network as unknown as NetworkManager);
    manager.enable();

    network.emit("message", {
      type: "ephemeral",
      from: "peer-b",
      payload: JSON.stringify({
        peerId: "peer-b",
        sequence: 1,
        updatedAt: 100,
        state: { muted: { audio: false } },
      }),
    });
    network.emit("message", {
      type: "ephemeral",
      from: "peer-b",
      payload: JSON.stringify({
        peerId: "peer-b",
        sequence: 2,
        updatedAt: 101,
        remove: true,
      }),
    });

    expect(manager.getPeerState("peer-b")).toBeUndefined();

    manager.dispose();
  });
});
