export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface ZerithLogEntry {
  level: LogLevel;
  message: string;
  timestamp?: Date;
  context?: Record<string, unknown>;
}

export interface DatadogLogPayload {
  message: string;
  status: string;
  service: string;
  ddsource: string;
  ddtags: string;
  host: string;
  timestamp: string;   // ISO 8601
  logger?: { name: string };
  [key: string]: unknown; // passthrough extra fields
}

export interface DatadogPluginOptions {
  service: string;
  host?: string;
  source?: string;
  tags?: string[];
  env?: string;
  version?: string;
}