import type {
  ActiveSpeakerState,
  EphemeralPeerState,
  MediaStreamMetadata,
  PeerId,
  VideoParticipantState,
} from "zerithdb-core";
import { EventEmitter } from "zerithdb-core";
import type { MediaStreamMetadataInput, NetworkManager } from "zerithdb-network";
import type { SyncEngine } from "./sync-engine.js";

type VideoEphemeralState = Record<string, unknown> & {
  videoConference?: VideoParticipantState;
};

type VideoConferenceEvents = {
  "participant:updated": VideoParticipantState;
  "stream:added": { peerId: PeerId; stream: MediaStream; metadata?: MediaStreamMetadata };
  "stream:removed": { peerId: PeerId; streamId: string };
  "active-speaker:changed": ActiveSpeakerState | null;
};

export type VideoStreamMetadataInput = MediaStreamMetadataInput;

/**
 * High-level orchestration for mesh video calls on top of ZerithDB.
 *
 * Media flows through `zerithdb-network` WebRTC peer connections. Fast-changing
 * call metadata such as mute state, active speaker, and stream descriptions
 * flows through `sync.ephemeral`, so it is low-latency and never persisted.
 */
export class VideoConferenceManager extends EventEmitter<VideoConferenceEvents> {
  private readonly participants = new Map<PeerId, VideoParticipantState>();
  private localParticipant: VideoParticipantState;

  constructor(
    private readonly sync: SyncEngine,
    private readonly network: NetworkManager
  ) {
    super();

    this.localParticipant = {
      peerId: this.network.peerId,
      muted: { audio: false, video: false },
      streams: {},
      updatedAt: Date.now(),
    };

    this.onEphemeralChange = this.onEphemeralChange.bind(this);
    this.onRemoteStream = this.onRemoteStream.bind(this);
    this.onRemoteStreamRemoved = this.onRemoteStreamRemoved.bind(this);

    this.sync.ephemeral.enable();
    this.sync.ephemeral.on("change", this.onEphemeralChange);
    this.network.on("media:stream", this.onRemoteStream);
    this.network.on("media:stream:removed", this.onRemoteStreamRemoved);
  }

  /**
   * Publish a local camera, microphone, or screen MediaStream to all peers.
   */
  publishStream(stream: MediaStream, metadata: VideoStreamMetadataInput = {}): MediaStreamMetadata {
    const normalized = this.network.addMediaStream(stream, metadata);
    this.localParticipant.streams[normalized.streamId] = normalized;
    this.refreshLocalMuteSummary();
    this.publishLocalParticipant({ immediate: true });
    return normalized;
  }

  /**
   * Stop sending a local MediaStream to peers.
   */
  unpublishStream(streamOrId: MediaStream | string): void {
    const streamId = typeof streamOrId === "string" ? streamOrId : streamOrId.id;
    this.network.removeMediaStream(streamOrId);
    delete this.localParticipant.streams[streamId];
    this.refreshLocalMuteSummary();
    this.publishLocalParticipant({ immediate: true });
  }

  /**
   * Update stream labels or custom metadata and sync them to the call.
   */
  updateStreamMetadata(
    streamId: string,
    metadata: VideoStreamMetadataInput
  ): MediaStreamMetadata | undefined {
    const updated = this.network.updateMediaStreamMetadata(streamId, metadata);
    if (updated === undefined) return undefined;

    this.localParticipant.streams[streamId] = updated;
    this.refreshLocalMuteSummary();
    this.publishLocalParticipant({ immediate: true });
    return updated;
  }

  /**
   * Mute or unmute local audio/video tracks and broadcast the new status.
   */
  setMuted(kind: "audio" | "video", muted: boolean, streamId?: string): void {
    this.network.setMediaTrackEnabled(kind, !muted, streamId);
    this.syncLocalStreamMetadata();
    this.localParticipant.muted = {
      ...this.localParticipant.muted,
      [kind]: muted,
    };
    this.publishLocalParticipant({ immediate: true });
  }

  /**
   * Publish the active speaker selected by local audio detection or app logic.
   */
  setActiveSpeaker(
    peerId: PeerId,
    details: Partial<Omit<ActiveSpeakerState, "peerId" | "updatedAt">> = {}
  ): ActiveSpeakerState {
    const activeSpeaker: ActiveSpeakerState = {
      ...details,
      peerId,
      updatedAt: Date.now(),
    };

    this.localParticipant = {
      ...this.localParticipant,
      activeSpeaker,
      updatedAt: Date.now(),
    };
    this.publishLocalParticipant({ immediate: true });
    return activeSpeaker;
  }

  /** Latest participant metadata keyed by peer ID. */
  getParticipants(): Map<PeerId, VideoParticipantState> {
    return new Map(this.participants);
  }

  /** Latest participant metadata for one peer. */
  getParticipant(peerId: PeerId): VideoParticipantState | undefined {
    return this.participants.get(peerId);
  }

  /** Tear down event listeners owned by the video facade. */
  dispose(): void {
    this.sync.ephemeral.off("change", this.onEphemeralChange);
    this.network.off("media:stream", this.onRemoteStream);
    this.network.off("media:stream:removed", this.onRemoteStreamRemoved);
  }

  private publishLocalParticipant(options: { immediate?: boolean } = {}): void {
    this.localParticipant = {
      ...this.localParticipant,
      peerId: this.network.peerId,
      streams: { ...this.localParticipant.streams },
      updatedAt: Date.now(),
    };
    this.participants.set(this.network.peerId, this.localParticipant);
    this.sync.ephemeral.patchLocalState(
      { videoConference: this.localParticipant } as Partial<Record<string, unknown>>,
      { immediate: options.immediate }
    );
  }

  private syncLocalStreamMetadata(): void {
    const streams: Record<string, MediaStreamMetadata> = {};
    for (const metadata of this.network.getLocalMediaStreamMetadata()) {
      streams[metadata.streamId] = metadata;
    }
    this.localParticipant = {
      ...this.localParticipant,
      streams,
    };
    this.refreshLocalMuteSummary();
  }

  private refreshLocalMuteSummary(): void {
    const streams = Object.values(this.localParticipant.streams);
    const audioStreams = streams.filter((stream) =>
      stream.tracks.some((track) => track.kind === "audio")
    );
    const videoStreams = streams.filter((stream) =>
      stream.tracks.some((track) => track.kind === "video")
    );

    this.localParticipant = {
      ...this.localParticipant,
      muted: {
        audio: audioStreams.length > 0 && audioStreams.every((stream) => stream.audioMuted),
        video: videoStreams.length > 0 && videoStreams.every((stream) => stream.videoMuted),
      },
    };
  }

  private onEphemeralChange(
    states: Map<PeerId, EphemeralPeerState<Record<string, unknown>>>
  ): void {
    let activeSpeaker: ActiveSpeakerState | null = null;
    const seenParticipantIds = new Set<PeerId>();

    for (const [peerId, snapshot] of states) {
      const participant = toVideoParticipant(peerId, snapshot.state);
      if (participant === undefined) continue;

      seenParticipantIds.add(peerId);
      this.participants.set(peerId, participant);
      this.emit("participant:updated", participant);

      if (
        participant.activeSpeaker !== undefined &&
        (activeSpeaker === null || participant.activeSpeaker.updatedAt > activeSpeaker.updatedAt)
      ) {
        activeSpeaker = participant.activeSpeaker;
      }
    }

    for (const peerId of this.participants.keys()) {
      if (peerId !== this.network.peerId && !seenParticipantIds.has(peerId)) {
        this.participants.delete(peerId);
      }
    }

    this.emit("active-speaker:changed", activeSpeaker);
  }

  private onRemoteStream(event: {
    peerId: PeerId;
    stream: MediaStream;
    metadata?: MediaStreamMetadata;
  }): void {
    this.emit("stream:added", event);
  }

  private onRemoteStreamRemoved(event: { peerId: PeerId; streamId: string }): void {
    this.emit("stream:removed", event);
  }
}

function toVideoParticipant(
  peerId: PeerId,
  state: Record<string, unknown>
): VideoParticipantState | undefined {
  const value = (state as VideoEphemeralState).videoConference;
  if (!isVideoParticipantState(value)) return undefined;

  return {
    ...value,
    peerId,
  };
}

function isVideoParticipantState(value: unknown): value is VideoParticipantState {
  if (!isRecord(value)) return false;
  if (!isRecord(value.muted)) return false;
  if (!isRecord(value.streams)) return false;
  return typeof value.peerId === "string" && typeof value.updatedAt === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
