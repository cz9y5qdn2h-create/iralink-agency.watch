from collections.abc import Callable
from functools import lru_cache

import httpx
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

from app.config import settings
from app.schemas import TokenClaims

bearer = HTTPBearer(auto_error=True)


@lru_cache(maxsize=1)
def _load_jwks() -> dict:
    jwks_url = settings.oidc_jwks_url or f"{settings.oidc_issuer.rstrip('/')}/.well-known/jwks.json"
    response = httpx.get(jwks_url, timeout=5)
    response.raise_for_status()
    return response.json()


def _get_public_key(token: str) -> dict:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing kid")

    jwks = _load_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")


def decode_token(credentials: HTTPAuthorizationCredentials = Security(bearer)) -> TokenClaims:
    token = credentials.credentials
    try:
        key = _get_public_key(token)
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.oidc_audience,
            issuer=settings.oidc_issuer,
            options={"verify_at_hash": False},
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    extracted_roles = claims.get("roles") or claims.get("realm_access", {}).get("roles", [])
    if not extracted_roles and "cognito:groups" in claims:
        extracted_roles = claims.get("cognito:groups", [])

    return TokenClaims(**claims, roles=extracted_roles)


def require_roles(*required_roles: str) -> Callable:
    def dependency(claims: TokenClaims = Depends(decode_token)) -> TokenClaims:
        if not set(required_roles).intersection(claims.roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return claims

    return dependency
