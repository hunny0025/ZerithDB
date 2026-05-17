import  datetime, pytest

from zerithdb_datadog import format_for_datadog

OPTS = {"service": "test", "env": "test", "tags": ["team:core"]}

def test_warn_maps_to_warning():
    p = format_for_datadog({"level": "warn", "message": "low mem"}, OPTS)
    assert p["status"] == "warning"

def test_ddtags_contains_env():
    p = format_for_datadog({"level": "info", "message": "ok"}, OPTS)
    assert "env:test" in p["ddtags"]
    assert "team:core" in p["ddtags"]

def test_context_spread():
    p = format_for_datadog(
        {"level": "error", "message": "oops", "context": {"peer_id": "x"}},
        OPTS
    )
    assert p["peer_id"] == "x"

def test_timestamp_format():
    ts = datetime.datetime(2026, 1, 15, 10, 30, 0)
    p = format_for_datadog({"level": "info", "message": "t", "timestamp": ts}, OPTS)
    assert p["timestamp"].endswith("Z")