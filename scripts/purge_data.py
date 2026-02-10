from app.audit import purge_expired_audit_logs
from app.database import SessionLocal


def main():
    with SessionLocal() as db:
        removed = purge_expired_audit_logs(db)
        db.commit()
        print(f"Purged {removed} expired audit log(s)")


if __name__ == "__main__":
    main()
