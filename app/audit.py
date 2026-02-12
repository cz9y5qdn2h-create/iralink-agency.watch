import hashlib
import hmac
import json
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings


class ImmutableAuditLogger:
    def __init__(self, path: str):
        self.path = Path(path)
        self.path.touch(exist_ok=True)

    def _last_hash(self) -> str:
        lines = self.path.read_text().splitlines()
        if not lines:
            return "GENESIS"
        try:
            previous = json.loads(lines[-1])
            return previous["entry_hash"]
        except Exception:
            return "CORRUPTED"

    def append(self, event_type: str, actor: str, details: dict):
        previous_hash = self._last_hash()
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "actor": actor,
            "details": details,
            "previous_hash": previous_hash,
        }
        serialized = json.dumps(entry, sort_keys=True, separators=(",", ":"))
        signature = hmac.new(
            settings.audit_hmac_key.encode("utf-8"),
            serialized.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).hexdigest()
        entry_hash = hashlib.sha256(f"{serialized}:{signature}".encode("utf-8")).hexdigest()
        entry["signature"] = signature
        entry["entry_hash"] = entry_hash
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")


audit_logger = ImmutableAuditLogger(settings.audit_log_path)
