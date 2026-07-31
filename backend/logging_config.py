"""Structured JSON logging — every DAK project ships with this.

Every log line is a single JSON object with timestamp, level, logger,
message, and any `extra` fields. Makes logs ready for any aggregator
(Loki, Datadog, CloudWatch) without per-project work.
"""
import json
import logging
import sys
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    # LogRecord attributes that already have a dedicated slot in the
    # output — don't duplicate them under `extra`.
    RESERVED = {
        "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
        "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
        "created", "msecs", "relativeCreated", "thread", "threadName",
        "processName", "process", "taskName",
    }

    def format(self, record: logging.LogRecord) -> str:
        out = {
            "ts": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Merge any custom `extra=...` fields.
        for k, v in record.__dict__.items():
            if k not in self.RESERVED and not k.startswith("_"):
                out[k] = v
        if record.exc_info:
            out["exc"] = self.formatException(record.exc_info)
        return json.dumps(out, default=str)


def configure_logging(level: str = "INFO") -> None:
    root = logging.getLogger()
    root.setLevel(level)
    # Replace any default handlers with one JSON handler on stdout.
    for h in list(root.handlers):
        root.removeHandler(h)
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(JsonFormatter())
    root.addHandler(h)

    # Optional Sentry integration — only active if SENTRY_DSN is set.
    import os
    dsn = os.environ.get("SENTRY_DSN")
    if dsn:
        try:
            import sentry_sdk
            sentry_sdk.init(dsn=dsn, traces_sample_rate=0.1)
            logging.getLogger("app").info("sentry initialized")
        except ImportError:
            logging.getLogger("app").warning("SENTRY_DSN set but sentry-sdk not installed")
