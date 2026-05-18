---
"zerithdb-signaling-server": patch
---

Instrument the signaling server with OpenTelemetry to track request paths and latency.

- Adds `src/internal/tracing.ts`: bootstraps the OTel NodeSDK with OTLP HTTP exporters for traces
  and metrics. Supports Jaeger and Datadog via `OTEL_EXPORTER_OTLP_ENDPOINT`. Gracefully flushes on
  `SIGTERM`.
- Adds `src/internal/metrics.ts`: observable gauges for active rooms, peers, and polling sessions;
  counters for messages relayed and peer join/leave events — all tagged by transport (`ws`/`poll`).
- Adds manual spans to `server.ts` for WebSocket lifecycle (`ws.connection`, `ws.message.relay`,
  `ws.disconnect`, `ws.error`) and polling endpoints (`poll.join`, `poll.send`, `poll.leave`,
  `poll.long_poll.wait`, `poll.session.cleanup`), making the 30 s long-poll hold window visible in
  traces.
- Updates `.env.example` with `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, and
  `OTEL_SDK_DISABLED`.
- Updates `Dockerfile` with default OTel env vars.
- No changes to signaling behaviour — purely observability.
