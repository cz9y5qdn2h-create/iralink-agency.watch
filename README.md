# IRALINK Agency Watch - Secure API baseline

Implémentation demandée:

- OAuth2/OIDC (Auth0/Keycloak/Cognito via paramètres OIDC)
- RBAC (`admin`, `analyst`, `user`)
- Rate limiting API
- Journaux d'audit immuables (chaînage de hash)
- Chiffrement des PII au niveau colonne (Fernet)
- Politique de rétention & purge des logs d'audit
- CI sécurité (SAST + scan dépendances) et tests OWASP API Top 10

## Configuration

Variables d'environnement principales:

- `OIDC_ISSUER`
- `OIDC_AUDIENCE`
- `OIDC_JWKS_URL` (optionnel)
- `ENCRYPTION_KEY` (clé Fernet)
- `RATE_LIMIT_DEFAULT`
- `AUDIT_RETENTION_DAYS`

## Lancer l'API

```bash
pip install -e .[dev]
uvicorn app.main:app --reload
```

## Purge rétention

```bash
python scripts/purge_data.py
```

## Tests

```bash
pytest -q
```
