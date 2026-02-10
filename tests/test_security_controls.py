from fastapi.testclient import TestClient
from sqlalchemy import text

from app.auth import decode_token
from app.database import Base, engine
from app.main import app
from app.schemas import TokenClaims


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


class ClaimsFactory:
    @staticmethod
    def admin():
        return TokenClaims(sub="admin-1", iss="issuer", aud="aud", exp=4102444800, roles=["admin"])

    @staticmethod
    def analyst():
        return TokenClaims(sub="analyst-1", iss="issuer", aud="aud", exp=4102444800, roles=["analyst"])

    @staticmethod
    def user():
        return TokenClaims(sub="user-1", iss="issuer", aud="aud", exp=4102444800, roles=["user"])


def test_rbac_blocks_user_from_admin_audit_endpoint():
    app.dependency_overrides[decode_token] = ClaimsFactory.user
    with TestClient(app) as client:
        response = client.get("/audit-logs")
    assert response.status_code == 403


def test_rbac_allows_analyst_to_list_profiles():
    app.dependency_overrides[decode_token] = ClaimsFactory.analyst
    with TestClient(app) as client:
        response = client.get("/profiles")
    assert response.status_code == 200


def test_pii_is_encrypted_at_rest():
    app.dependency_overrides[decode_token] = ClaimsFactory.user
    with TestClient(app) as client:
        create = client.post("/profiles", json={"email": "pii@example.com", "full_name": "Pii Name"})
        assert create.status_code == 200

    with engine.connect() as conn:
        raw_value = conn.execute(text("SELECT email FROM user_profiles WHERE subject='user-1' LIMIT 1")).first()[0]
    assert raw_value != "pii@example.com"


def test_owasp_api1_bola_prevented_for_sensitive_endpoint():
    app.dependency_overrides[decode_token] = ClaimsFactory.user
    with TestClient(app) as client:
        response = client.get("/profiles")
    assert response.status_code == 403


def test_owasp_api4_rate_limit_returns_429():
    app.dependency_overrides[decode_token] = ClaimsFactory.user
    with TestClient(app) as client:
        seen_429 = False
        for i in range(35):
            response = client.post("/profiles", json={"email": f"x{i}@example.com", "full_name": "X"})
            if response.status_code == 429:
                seen_429 = True
                break
    assert seen_429
