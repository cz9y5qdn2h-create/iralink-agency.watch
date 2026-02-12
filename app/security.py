from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import InvalidTokenError

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=True)


@dataclass
class Principal:
    sub: str
    roles: set[str]
    scope: set[str]
    iss: str
    aud: str | list[str]


def _expected_issuer() -> str:
    provider_defaults = {
        "auth0": settings.oidc_issuer,
        "keycloak": settings.oidc_issuer,
        "cognito": settings.oidc_issuer,
    }
    return provider_defaults.get(settings.oidc_provider, settings.oidc_issuer)


def decode_access_token(token: str) -> Principal:
    try:
        payload = jwt.decode(
            token,
            settings.oidc_shared_secret,
            algorithms=settings.oidc_algorithms,
            audience=settings.oidc_audience,
            issuer=_expected_issuer(),
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        ) from exc

    roles = set(payload.get("roles", []))
    scopes = set((payload.get("scope") or "").split())

    return Principal(
        sub=payload.get("sub", "unknown"),
        roles=roles,
        scope=scopes,
        iss=payload.get("iss", ""),
        aud=payload.get("aud", ""),
    )


def get_current_principal(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Principal:
    return decode_access_token(credentials.credentials)


def require_roles(*required_roles: str):
    required = set(required_roles)

    def dependency(principal: Principal = Depends(get_current_principal)) -> Principal:
        if not required.intersection(principal.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"RBAC denied. Required any of: {sorted(required)}",
            )
        return principal

    return dependency
