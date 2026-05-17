export * from "./types";
export * from "./formatter";

import { DatadogPluginOptions, ZerithLogEntry } from "./types";
import { formatForDatadog } from "./formatter";

/**
 * createDatadogPlugin — attach to any ZerithDB app instance.
 *
 * Usage:
 *   const plugin = createDatadogPlugin({ service: "my-app", env: "prod" });
 *   plugin.log({ level: "info", message: "Peer connected", context: { peerId } });
 *   const ddPayload = plugin.format(entry);  // use with DD agent / HTTP API
 */
export function createDatadogPlugin(opts: DatadogPluginOptions) {
  const queue: ReturnType<typeof formatForDatadog>[] = [];

  return {
    /** Format a single entry for Datadog */
    format(entry: ZerithLogEntry) {
      return formatForDatadog(entry, opts);
    },

    /** Log and enqueue; flush manually or on interval */
    log(entry: ZerithLogEntry) {
      queue.push(formatForDatadog(entry, opts));
    },

    /** Return and clear the queue */
    flush() {
      return queue.splice(0);
    },

    /** Serialize queue to NDJSON for DD HTTP API */
    toNDJSON() {
      return this.flush().map((p) => JSON.stringify(p)).join("\n");
    },
  };
}