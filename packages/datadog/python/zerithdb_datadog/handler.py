import logging, json, datetime
from .formatter import format_for_datadog, DatadogPluginOptions

class DatadogFormatter(logging.Handler):
    """
    Drop-in logging handler that emits JSON lines
    formatted for Datadog ingestion.

    Usage:
        import logging
        from zerithdb_datadog import DatadogFormatter

        logger = logging.getLogger("signaling-server")
        handler = DatadogFormatter(
            opts={"service": "zerithdb-signal", "env": "prod"}
        )
        logger.addHandler(handler)
        logger.info("Peer connected", extra={"peer_id": "abc123"})
    """

    def __init__(self, opts: DatadogPluginOptions, **kwargs):
        super().__init__(**kwargs)
        self.opts = opts

    def emit(self, record: logging.LogRecord) -> None:
        level_map = {
            logging.DEBUG:    "debug",
            logging.INFO:     "info",
            logging.WARNING:  "warn",
            logging.ERROR:    "error",
            logging.CRITICAL: "critical",
        }
        entry = {
            "level":     level_map.get(record.levelno, "info"),
            "message":   record.getMessage(),
            "timestamp": datetime.datetime.utcfromtimestamp(record.created),
            "context":   {
                k: v for k, v in record.__dict__.items()
                if k not in logging.LogRecord("",0,"",0,"",[],None).__dict__
            },
        }
        payload = format_for_datadog(entry, self.opts)  # type: ignore[arg-type]
        print(json.dumps(payload))