# iralink-agency.watch

Baseline API sécurisée implémentant :

- OAuth2/OIDC compatible Auth0/Keycloak/Cognito (validation JWT standard OIDC)
- RBAC (`admin`, `analyst`, `user`)
- Rate limiting API (middleware)
- Journaux d'audit immuables (hash chain + signature HMAC)
- Chiffrement des PII au niveau colonne (email/téléphone)
- Politique de rétention et purge
- CI sécurité: SAST (Bandit) + audit dépendances (pip-audit)
- Tests orientés OWASP API Top 10

## Run

```bash
pip install -e .[dev]
uvicorn app.main:app --reload
```

## Config

Variables d'environnement principales:

- `OIDC_ISSUER`
- `OIDC_AUDIENCE`
- `OIDC_PROVIDER`
- `OIDC_SHARED_SECRET`
- `RATE_LIMIT_REQUESTS`
- `RATE_LIMIT_WINDOW_SECONDS`
- `AUDIT_LOG_PATH`
- `AUDIT_HMAC_KEY`
- `PII_ENCRYPTION_KEY`
- `RETENTION_DAYS`
