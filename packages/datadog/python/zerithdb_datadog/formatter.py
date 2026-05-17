from __future__ import annotations
import datetime, os, socket
from typing import Any, Literal, TypedDict

LogLevel = Literal["debug", "info", "warn", "error", "critical"]

class ZerithLogEntry(TypedDict, total=False):
    level:     LogLevel
    message:   str
    timestamp: datetime.datetime
    context:   dict[str, Any]

class DatadogPluginOptions(TypedDict, total=False):
    service: str
    host:    str
    source:  str
    tags:    list[str]
    env:     str
    version: str

# Datadog status values per level
_LEVEL_MAP: dict[str, str] = {
    "debug":    "debug",
    "info":     "info",
    "warn":     "warning",
    "error":    "error",
    "critical": "critical",
}

def format_for_datadog(
    entry: ZerithLogEntry,
    opts:  DatadogPluginOptions,
) -> dict[str, Any]:
    """Return a dict formatted for Datadog log ingestion."""
    now = entry.get("timestamp") or datetime.datetime.utcnow()
    tags: list[str] = []
    if env := opts.get("env"):
        tags.append(f"env:{env}")
    if ver := opts.get("version"):
        tags.append(f"version:{ver}")
    tags.extend(opts.get("tags", []))

    payload: dict[str, Any] = {
        "message":   entry["message"],
        "status":    _LEVEL_MAP.get(entry.get("level", "info"), "info"),
        "service":   opts["service"],
        "ddsource":  opts.get("source", "zerithdb"),
        "ddtags":    ",".join(tags),
        "host":      opts.get("host") or socket.gethostname(),
        "timestamp": now.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "logger":    {"name": "zerithdb-datadog"},
    }
    payload.update(entry.get("context", {}))  # spread extra fields
    return payload