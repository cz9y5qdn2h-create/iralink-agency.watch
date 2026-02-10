import json

from sqlalchemy import select

from app.audit import _compute_hash, append_audit_log
from app.database import SessionLocal
from app.models import AuditLog


def test_audit_chain_hashes_are_linked():
    with SessionLocal() as db:
        log1 = append_audit_log(db, "actor1", "create", "profile", {"id": 1})
        log2 = append_audit_log(db, "actor2", "read", "profile", {"id": 1})
        db.commit()

        expected1 = _compute_hash("actor1", "create", "profile", json.dumps({"id": 1}, sort_keys=True), None)
        expected2 = _compute_hash(
            "actor2", "read", "profile", json.dumps({"id": 1}, sort_keys=True), log1.record_hash
        )

        assert log1.record_hash == expected1
        assert log2.prev_hash == log1.record_hash
        assert log2.record_hash == expected2

        rows = db.scalars(select(AuditLog).order_by(AuditLog.id)).all()
        assert len(rows) >= 2
