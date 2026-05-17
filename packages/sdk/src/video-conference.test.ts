import { describe, expect, it } from "vitest";
import type {
  EphemeralPeerState,
  MediaStreamMetadata,
  PeerId,
  VideoParticipantState,
} from "zerithdb-core";
import { EventEmitter } from "zerithdb-core";
import type { NetworkManager } from "zerithdb-network";
import type { SyncEngine } from "./sync-engine.js";
import { VideoConferenceManager } from "./video-conference.js";

type EphemeralEvents = {
  change: Map<PeerId, EphemeralPeerState<Record<string, unknown>>>;
};

type NetworkEvents = {
  "media:stream": { peerId: PeerId; stream: MediaStream; metadata?: MediaStreamMetadata };
  "media:stream:removed": { peerId: PeerId; streamId: string };
};

class FakeEphemeral extends EventEmitter<EphemeralEvents> {
  enabled = false;
  readonly states = new Map<PeerId, EphemeralPeerState<Record<string, unknown>>>();

  constructor(private readonly localPeerId: PeerId) {
    super();
  }

  enable(): void {
    this.enabled = true;
  }

  patchLocalState(partial: Partial<Record<string, unknown>>): void {
    const previous = this.states.get(this.localPeerId)?.state ?? {};
    this.states.set(this.localPeerId, {
      peerId: this.localPeerId,
      state: { ...previous, ...partial },
      sequence: (this.states.get(this.localPeerId)?.sequence ?? 0) + 1,
      updatedAt: Date.now(),
    });
    this.emit("change", new Map(this.states));
  }
}

class FakeNetwork extends EventEmitter<NetworkEvents> {
  readonly peerId = "local-peer";
  private readonly metadata = new Map<string, MediaStreamMetadata>();

  addMediaStream(stream: MediaStream): MediaStreamMetadata {
    const normalized = toMetadata(this.peerId, stream);
    this.metadata.set(normalized.streamId, normalized);
    return normalized;
  }

  removeMediaStream(streamOrId: MediaStream | string): void {
    const streamId = typeof streamOrId === "string" ? streamOrId : streamOrId.id;
    this.metadata.delete(streamId);
  }

  updateMediaStreamMetadata(streamId: string): MediaStreamMetadata | undefined {
    return this.metadata.get(streamId);
  }

  setMediaTrackEnabled(kind: "audio" | "video", enabled: boolean, streamId?: string): void {
    for (const metadata of this.metadata.values()) {
      if (streamId !== undefined && metadata.streamId !== streamId) continue;
      for (const track of metadata.tracks) {
        if (track.kind === kind) {
          track.enabled = enabled;
        }
      }
      metadata.audioMuted = metadata.tracks
        .filter((track) => track.kind === "audio")
        .every((track) => !track.enabled);
      metadata.videoMuted = metadata.tracks
        .filter((track) => track.kind === "video")
        .every((track) => !track.enabled);
    }
  }

  getLocalMediaStreamMetadata(): MediaStreamMetadata[] {
    return [...this.metadata.values()];
  }
}

describe("VideoConferenceManager", () => {
  it("publishes stream metadata through ephemeral participant state", () => {
    const ephemeral = new FakeEphemeral("local-peer");
    const network = new FakeNetwork();
    const manager = new VideoConferenceManager(
      { ephemeral } as unknown as SyncEngine,
      network as unknown as NetworkManager
    );
    const updates: VideoParticipantState[] = [];
    manager.on("participant:updated", (participant) => updates.push(participant));

    const stream = createMediaStream("camera-1");
    const metadata = manager.publishStream(stream);

    expect(ephemeral.enabled).toBe(true);
    expect(metadata.streamId).toBe("camera-1");
    expect(updates.at(-1)?.streams["camera-1"]).toMatchObject({
      peerId: "local-peer",
      audioMuted: false,
      videoMuted: false,
    });
  });

  it("syncs mute state and active speaker without persisted writes", () => {
    const ephemeral = new FakeEphemeral("local-peer");
    const network = new FakeNetwork();
    const manager = new VideoConferenceManager(
      { ephemeral } as unknown as SyncEngine,
      network as unknown as NetworkManager
    );
    const activeSpeakers: Array<string | null> = [];
    manager.on("active-speaker:changed", (speaker) => activeSpeakers.push(speaker?.peerId ?? null));

    const stream = createMediaStream("camera-1");
    manager.publishStream(stream);
    manager.setMuted("audio", true);
    manager.setActiveSpeaker("local-peer", { audioLevel: 0.8 });

    const participant = manager.getParticipant("local-peer");
    expect(participant?.muted.audio).toBe(true);
    expect(participant?.streams["camera-1"]?.audioMuted).toBe(true);
    expect(activeSpeakers.at(-1)).toBe("local-peer");
  });

  it("forwards remote stream events from the network mesh", () => {
    const network = new FakeNetwork();
    const manager = new VideoConferenceManager(
      { ephemeral: new FakeEphemeral("local-peer") } as unknown as SyncEngine,
      network as unknown as NetworkManager
    );
    const remoteStreams: Array<{ peerId: PeerId; stream: MediaStream }> = [];
    manager.on("stream:added", ({ peerId, stream }) => remoteStreams.push({ peerId, stream }));

    const stream = createMediaStream("remote-camera");
    network.emit("media:stream", {
      peerId: "remote-peer",
      stream,
    });

    expect(remoteStreams).toEqual([{ peerId: "remote-peer", stream }]);
  });
});

function createMediaStream(id: string): MediaStream {
  const audioTrack = createTrack("audio-1", "audio");
  const videoTrack = createTrack("video-1", "video");
  return {
    id,
    getTracks: () => [audioTrack, videoTrack],
    getAudioTracks: () => [audioTrack],
    getVideoTracks: () => [videoTrack],
  } as unknown as MediaStream;
}

function createTrack(id: string, kind: "audio" | "video"): MediaStreamTrack {
  return {
    id,
    kind,
    label: id,
    enabled: true,
    muted: false,
    readyState: "live",
  } as unknown as MediaStreamTrack;
}

function toMetadata(peerId: PeerId, stream: MediaStream): MediaStreamMetadata {
  const tracks = stream.getTracks().map((track) => ({
    trackId: track.id,
    kind: track.kind as "audio" | "video",
    label: track.label,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState,
  }));

  return {
    streamId: stream.id,
    peerId,
    kind: "camera",
    audioMuted: tracks.filter((track) => track.kind === "audio").every((track) => !track.enabled),
    videoMuted: tracks.filter((track) => track.kind === "video").every((track) => !track.enabled),
    tracks,
    updatedAt: Date.now(),
  };
}
