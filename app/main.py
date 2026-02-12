from datetime import datetime, timezone
from uuid import uuid4

from fastapi import Depends, FastAPI
from pydantic import BaseModel, Field

from app.audit import audit_logger
from app.crypto import decrypt_pii, encrypt_pii
from app.rate_limit import RateLimitMiddleware
from app.retention import purge_expired_records
from app.security import Principal, require_roles

app = FastAPI(title="Iralink Secure API")
app.add_middleware(RateLimitMiddleware)

_DB: list[dict] = []


class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=1)
    email: str
    phone: str


class CustomerOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    created_at: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/customers", response_model=CustomerOut)
def create_customer(
    payload: CustomerCreate,
    principal: Principal = Depends(require_roles("admin", "analyst")),
):
    row = {
        "id": str(uuid4()),
        "full_name": payload.full_name,
        "email_enc": encrypt_pii(payload.email),
        "phone_enc": encrypt_pii(payload.phone),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _DB.append(row)
    audit_logger.append("customer_created", principal.sub, {"customer_id": row["id"]})
    return CustomerOut(
        id=row["id"],
        full_name=row["full_name"],
        email=payload.email,
        phone=payload.phone,
        created_at=row["created_at"],
    )


@app.get("/customers", response_model=list[CustomerOut])
def list_customers(principal: Principal = Depends(require_roles("admin", "analyst", "user"))):
    sanitized = purge_expired_records(_DB)
    audit_logger.append("customers_listed", principal.sub, {"count": len(sanitized)})
    return [
        CustomerOut(
            id=row["id"],
            full_name=row["full_name"],
            email=decrypt_pii(row["email_enc"]),
            phone=decrypt_pii(row["phone_enc"]),
            created_at=row["created_at"],
        )
        for row in sanitized
    ]


@app.post("/retention/purge")
def purge(principal: Principal = Depends(require_roles("admin"))):
    global _DB
    before = len(_DB)
    _DB = purge_expired_records(_DB)
    removed = before - len(_DB)
    audit_logger.append("retention_purge", principal.sub, {"removed": removed})
    return {"removed": removed, "remaining": len(_DB)}
