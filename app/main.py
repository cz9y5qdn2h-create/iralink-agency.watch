from fastapi import Depends, FastAPI
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit import append_audit_log
from app.auth import decode_token, require_roles
from app.config import settings
from app.database import Base, engine, get_db
from app.models import UserProfile
from app.schemas import AuditLogOut, TokenClaims, UserProfileCreate, UserProfileOut

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])

app = FastAPI(title=settings.app_name)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me")
def me(claims: TokenClaims = Depends(decode_token)):
    return claims


@app.post("/profiles", response_model=UserProfileOut)
@limiter.limit("30/minute")
def create_profile(
    request: Request,
    payload: UserProfileCreate,
    claims: TokenClaims = Depends(require_roles("admin", "analyst", "user")),
    db: Session = Depends(get_db),
):
    profile = db.scalar(select(UserProfile).where(UserProfile.subject == claims.sub))
    if profile is None:
        profile = UserProfile(subject=claims.sub, email=payload.email, full_name=payload.full_name)
        db.add(profile)
    else:
        profile.email = payload.email
        profile.full_name = payload.full_name
    append_audit_log(db, claims.sub, "create", "profile", {"subject": claims.sub})
    db.commit()
    db.refresh(profile)
    return profile


@app.get("/profiles", response_model=list[UserProfileOut])
@limiter.limit("60/minute")
def list_profiles(
    request: Request,
    claims: TokenClaims = Depends(require_roles("admin", "analyst")),
    db: Session = Depends(get_db),
):
    append_audit_log(db, claims.sub, "read", "profile", {"scope": "all"})
    db.commit()
    return db.scalars(select(UserProfile)).all()


@app.get("/audit-logs", response_model=list[AuditLogOut])
def get_audit_logs(
    claims: TokenClaims = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    from app.models import AuditLog

    append_audit_log(db, claims.sub, "read", "audit_log", {"scope": "all"})
    db.commit()
    return db.scalars(select(AuditLog).order_by(AuditLog.id)).all()
