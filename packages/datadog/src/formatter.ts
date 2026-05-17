import { ZerithLogEntry, DatadogLogPayload, DatadogPluginOptions, LogLevel } from "./types";

/** Datadog status string per log level */
const LEVEL_MAP: Record<LogLevel, string> = {
  debug:    "debug",
  info:     "info",
  warn:     "warning",
  error:    "error",
  critical: "critical",
};

export function formatForDatadog(
  entry: ZerithLogEntry,
  opts: DatadogPluginOptions
): DatadogLogPayload {
  const tags: string[] = [
    opts.env     ? `env:${opts.env}`         : "",
    opts.version ? `version:${opts.version}` : "",
    ...(opts.tags ?? []),
  ].filter(Boolean);

  return {
    message:   entry.message,
    status:    LEVEL_MAP[entry.level] ?? "info",
    service:   opts.service,
    ddsource:  opts.source ?? "zerithdb",
    ddtags:    tags.join(","),
    host: opts.host ?? (typeof process !== "undefined" ? process.env.HOSTNAME ?? "unknown" : "unknown"),
    timestamp: (entry.timestamp ?? new Date()).toISOString(),
    logger:    { name: "zerithdb-datadog" },
    ...entry.context,  // spread extra fields (peerId, appId, etc.)
  };
}

/** Batch-format multiple entries */
export function formatBatch(
  entries: ZerithLogEntry[],
  opts: DatadogPluginOptions
): DatadogLogPayload[] {
  return entries.map((e) => formatForDatadog(e, opts));
}