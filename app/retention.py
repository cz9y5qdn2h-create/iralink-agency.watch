from datetime import datetime, timezone, timedelta

from app.config import settings


def purge_expired_records(records: list[dict]) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.retention_days)
    kept = []
    for row in records:
        created_at = datetime.fromisoformat(row["created_at"])
        if created_at >= cutoff:
            kept.append(row)
    return kept
