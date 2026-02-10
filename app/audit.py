import hashlib
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import AuditLog


def _compute_hash(actor_sub: str, action: str, resource: str, details: str, prev_hash: str | None) -> str:
    payload = f"{actor_sub}|{action}|{resource}|{details}|{prev_hash or ''}"
    return hashlib.sha256(payload.encode()).hexdigest()


def append_audit_log(db: Session, actor_sub: str, action: str, resource: str, details: dict) -> AuditLog:
    latest = db.scalar(select(AuditLog).order_by(AuditLog.id.desc()).limit(1))
    prev_hash = latest.record_hash if latest else None
    details_json = json.dumps(details, sort_keys=True)
    record_hash = _compute_hash(actor_sub, action, resource, details_json, prev_hash)

    log = AuditLog(
        actor_sub=actor_sub,
        action=action,
        resource=resource,
        details=details_json,
        prev_hash=prev_hash,
        record_hash=record_hash,
    )
    db.add(log)
    db.flush()
    return log


def purge_expired_audit_logs(db: Session) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.audit_retention_days)
    stale_logs = db.scalars(select(AuditLog).where(AuditLog.created_at < cutoff)).all()
    for log in stale_logs:
        db.delete(log)
    return len(stale_logs)
