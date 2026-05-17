/**
 * @internal
 * OpenTelemetry SDK bootstrap for the ZerithDB signaling server.
 *
 * Must be imported BEFORE any other module in the entry point so that
 * auto-instrumentation patches are applied before `http` and `ws` are loaded.
 *
 * Supports two export backends via environment variables:
 *  - Jaeger  : set OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger-host:4318
 *  - Datadog : set OTEL_EXPORTER_OTLP_ENDPOINT=http://datadog-agent:4318
 *              (requires DD Agent with OTLP receiver enabled)
 *
 * Environment variables:
 *  OTEL_SERVICE_NAME          Service name shown in traces (default: zerithdb-signaling)
 *  OTEL_EXPORTER_OTLP_ENDPOINT  OTLP HTTP collector URL (default: http://localhost:4318)
 *  OTEL_SDK_DISABLED          Set to "true" to disable all telemetry (default: false)
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import type { ClientRequest, IncomingMessage } from "http";

// ─── Diagnostic logging (only in non-production) ────────────────────────────

if (process.env["NODE_ENV"] !== "production") {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);
}

// ─── Early-exit if telemetry is explicitly disabled ──────────────────────────

const SDK_DISABLED = process.env["OTEL_SDK_DISABLED"] === "true";

// ─── Configuration ───────────────────────────────────────────────────────────

const SERVICE_NAME = process.env["OTEL_SERVICE_NAME"] ?? "zerithdb-signaling";
const SERVICE_VERSION = "0.1.0";
const OTLP_ENDPOINT = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4318";

// ─── SDK initialisation ──────────────────────────────────────────────────────

let sdk: NodeSDK | null = null;

if (!SDK_DISABLED) {
  const traceExporter = new OTLPTraceExporter({
    url: `${OTLP_ENDPOINT}/v1/traces`,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${OTLP_ENDPOINT}/v1/metrics`,
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    }),
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      /** Export metrics every 30 seconds */
      exportIntervalMillis: 30_000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // HTTP instrumentation covers all /poll/* routes automatically
        "@opentelemetry/instrumentation-http": {
          enabled: true,
          /** Attach route-level attributes to spans */
          requestHook: (span, request: ClientRequest | IncomingMessage) => {
            if ("url" in request && typeof request.url === "string") {
              span.setAttribute("http.route", request.url.split("?")[0] ?? "/");
            }
          },
        },
        // Disable noisy fs instrumentation
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  // start() is synchronous in this SDK version. We wrap it in a try/catch
  // so a misconfigured exporter logs clearly rather than crashing the server.
  try {
    sdk.start();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[otel] SDK failed to start: ${message}`);
  }

  console.log(
    `[otel] Tracing enabled → ${OTLP_ENDPOINT} (service: ${SERVICE_NAME} v${SERVICE_VERSION})`
  );
}

// ─── Graceful shutdown ───────────────────────────────────────────────────────

/**
 * Flush all pending spans and metrics then shut down the SDK.
 * Call this during process shutdown BEFORE closing the HTTP server.
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk === null) return;
  try {
    await sdk.shutdown();
    console.log("[otel] SDK shut down cleanly.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[otel] Error during SDK shutdown: ${message}`);
  }
}
