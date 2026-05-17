/**
 * @internal
 * Application-level metrics for the ZerithDB signaling server.
 *
 * Exposes observable gauges and counters that are collected by the
 * OpenTelemetry SDK and exported via OTLP to Datadog / Jaeger.
 *
 * Usage:
 *   import { recordPeerJoined, recordPeerLeft, recordMessageRelayed } from "./metrics.js";
 */

import { metrics, type ObservableResult } from "@opentelemetry/api";

const meter = metrics.getMeter("zerithdb-signaling", "0.1.0");

// ─── Counters ────────────────────────────────────────────────────────────────

/**
 * Total number of signaling messages relayed since process start.
 * Tagged with `relay.type` = "unicast" | "broadcast" and `transport` = "ws" | "poll".
 */
const messagesRelayedCounter = meter.createCounter("zerithdb.signaling.messages_relayed", {
  description: "Total signaling messages relayed between peers",
  unit: "messages",
});

/**
 * Total number of peers that have joined rooms since process start.
 * Tagged with `transport` = "ws" | "poll".
 */
const peersJoinedCounter = meter.createCounter("zerithdb.signaling.peers_joined", {
  description: "Total peers that have joined a room",
  unit: "peers",
});

/**
 * Total number of peers that have left rooms since process start.
 * Tagged with `transport` = "ws" | "poll" and `reason` = "graceful" | "timeout" | "error".
 */
const peersLeftCounter = meter.createCounter("zerithdb.signaling.peers_left", {
  description: "Total peers that have left a room",
  unit: "peers",
});

// ─── Observable gauges (backed by live state maps) ───────────────────────────

/** Callback references so the gauges can read live state. */
let getRoomCount: () => number = () => 0;
let getPeerCount: () => number = () => 0;
let getPollingSessionCount: () => number = () => 0;

meter
  .createObservableGauge("zerithdb.signaling.rooms_active", {
    description: "Number of currently active rooms",
    unit: "rooms",
  })
  .addCallback((result: ObservableResult) => {
    result.observe(getRoomCount());
  });

meter
  .createObservableGauge("zerithdb.signaling.peers_active", {
    description: "Total number of currently connected peers across all rooms",
    unit: "peers",
  })
  .addCallback((result: ObservableResult) => {
    result.observe(getPeerCount());
  });

meter
  .createObservableGauge("zerithdb.signaling.polling_sessions_active", {
    description: "Number of currently active long-polling sessions",
    unit: "sessions",
  })
  .addCallback((result: ObservableResult) => {
    result.observe(getPollingSessionCount());
  });

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Register live-state provider callbacks so the observable gauges can
 * read current values at export time.
 *
 * Call once during server initialisation, passing accessors to the
 * `rooms` and `pollingSessions` maps.
 */
export function registerStateProviders(providers: {
  getRoomCount: () => number;
  getPeerCount: () => number;
  getPollingSessionCount: () => number;
}): void {
  getRoomCount = providers.getRoomCount;
  getPeerCount = providers.getPeerCount;
  getPollingSessionCount = providers.getPollingSessionCount;
}

/** Record a message relay event. */
export function recordMessageRelayed(
  relayType: "unicast" | "broadcast",
  transport: "ws" | "poll"
): void {
  messagesRelayedCounter.add(1, { "relay.type": relayType, transport });
}

/** Record a peer joining a room. */
export function recordPeerJoined(transport: "ws" | "poll"): void {
  peersJoinedCounter.add(1, { transport });
}

/** Record a peer leaving a room. */
export function recordPeerLeft(
  transport: "ws" | "poll",
  reason: "graceful" | "timeout" | "error"
): void {
  peersLeftCounter.add(1, { transport, reason });
}
