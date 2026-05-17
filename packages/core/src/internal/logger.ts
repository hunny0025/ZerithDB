import type { ZerithDBConfig } from "../types/config.js";

type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * Internal logger utility that respects the configured logLevel.
 */
export class Logger {
  private readonly level: number;
  private readonly prefix: string;

  constructor(config: ZerithDBConfig, scope: string) {
    this.level = LOG_LEVELS[config.logLevel ?? "warn"];
    this.prefix = `[ZerithDB:${scope}]`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.debug) {
      console.debug(this.prefix, message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.info) {
      console.info(this.prefix, message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.warn) {
      console.warn(this.prefix, message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LOG_LEVELS.error) {
      console.error(this.prefix, message, ...args);
    }
  }
}
