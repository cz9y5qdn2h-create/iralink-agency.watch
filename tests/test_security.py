from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
import jwt

from app.config import settings
from app.main import _DB, app

client = TestClient(app)


def make_token(roles: list[str], sub: str = "tester") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "roles": roles,
        "scope": "openid profile email",
        "iss": settings.oidc_issuer,
        "aud": settings.oidc_audience,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
    }
    return jwt.encode(payload, settings.oidc_shared_secret, algorithm=settings.oidc_algorithms[0])


def auth_headers(roles: list[str]):
    return {"Authorization": f"Bearer {make_token(roles)}"}


def clear_rate_limit_state():
    client.get("/health")
    instance = app.middleware_stack
    while hasattr(instance, "app"):
        if instance.__class__.__name__ == "RateLimitMiddleware":
            instance._hits.clear()
            return
        instance = instance.app


@pytest.fixture(autouse=True)
def isolated_state():
    _DB.clear()
    clear_rate_limit_state()


def test_unauthenticated_access_denied():
    response = client.get("/customers")
    assert response.status_code == 401


def test_rbac_user_cannot_purge():
    response = client.post("/retention/purge", headers=auth_headers(["user"]))
    assert response.status_code == 403


def test_rbac_admin_can_purge():
    response = client.post("/retention/purge", headers=auth_headers(["admin"]))
    assert response.status_code == 200


def test_rate_limiting_blocks_excessive_requests():
    headers = auth_headers(["user"])
    for _ in range(settings.rate_limit_requests):
        ok = client.get("/health", headers=headers)
        assert ok.status_code == 200

    blocked = client.get("/health", headers=headers)
    assert blocked.status_code == 429


def test_pii_is_not_returned_ciphertext():
    create = client.post(
        "/customers",
        headers=auth_headers(["analyst"]),
        json={"full_name": "Alice", "email": "alice@example.com", "phone": "+3312345678"},
    )
    assert create.status_code == 200

    listed = client.get("/customers", headers=auth_headers(["user"]))
    assert listed.status_code == 200
    data = listed.json()
    assert any(item["email"] == "alice@example.com" for item in data)
