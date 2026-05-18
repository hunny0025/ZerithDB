import { z } from "zod";

export const PeerIdSchema = z.string().min(1);

export const SyncUpdateMessageSchema = z
  .object({
    type: z.literal("sync-update"),
    payload: z.string(),
  })
  .strict();

export const AwarenessMessageSchema = z
  .object({
    type: z.literal("awareness"),
    payload: z.string(),
  })
  .strict();

export const PingMessageSchema = z
  .object({
    type: z.literal("ping"),
    payload: z.string().optional(),
  })
  .strict();

export const PongMessageSchema = z
  .object({
    type: z.literal("pong"),
    payload: z.string().optional(),
  })
  .strict();

export const EphemeralMessageSchema = z
  .object({
    type: z.literal("ephemeral"),
    payload: z.string(),
  })
  .strict();

export const MediaStreamMetadataMessageSchema = z
  .object({
    type: z.literal("media-stream-metadata"),
    payload: z.string(),
  })
  .strict();

export const MediaStreamRemovedMessageSchema = z
  .object({
    type: z.literal("media-stream-removed"),
    payload: z.string(),
  })
  .strict();

export const SyncUpgradeOfferMessageSchema = z
  .object({
    type: z.literal("sync-upgrade-offer"),
    payload: z.string(),
  })
  .strict();

export const SyncUpgradeAcceptMessageSchema = z
  .object({
    type: z.literal("sync-upgrade-accept"),
    payload: z.string(),
  })
  .strict();

export const LeaderHeartbeatMessageSchema = z
  .object({
    type: z.literal("leader:heartbeat"),
    payload: z.string(),
  })
  .strict();

export const PeerDataMessageSchema = z.discriminatedUnion("type", [
  SyncUpdateMessageSchema,
  AwarenessMessageSchema,
  EphemeralMessageSchema,
  MediaStreamMetadataMessageSchema,
  MediaStreamRemovedMessageSchema,
  SyncUpgradeOfferMessageSchema,
  SyncUpgradeAcceptMessageSchema,
  LeaderHeartbeatMessageSchema,
  PingMessageSchema,
  PongMessageSchema,
]);

export const IncomingPeerDataMessageSchema = z.discriminatedUnion("type", [
  SyncUpdateMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  AwarenessMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  EphemeralMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  MediaStreamMetadataMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  MediaStreamRemovedMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  SyncUpgradeOfferMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  SyncUpgradeAcceptMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  LeaderHeartbeatMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  PingMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),

  PongMessageSchema.extend({
    from: PeerIdSchema,
  }).strict(),
]);

export type PeerDataMessage = z.infer<typeof PeerDataMessageSchema>;

export type IncomingPeerDataMessage = z.infer<typeof IncomingPeerDataMessageSchema>;
