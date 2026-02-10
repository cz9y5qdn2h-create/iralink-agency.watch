# iralink-agency.watch monorepo

Structure monorepo pour une plateforme de veille horlogère avec frontend, API, services de collecte/scoring et infrastructure.

## Arborescence

- `apps/web` : Frontend Next.js + TypeScript
- `apps/api` : Backend FastAPI
- `services/collector` : Service de collecte des prix marketplaces
- `services/scoring` : Moteur de pertinence achat
- `infra` : OpenAPI, Docker Compose, IaC et observabilité

## Démarrage rapide

### API FastAPI

```bash
pip install -r requirements-dev.txt
uvicorn apps.api.app.main:app --reload
```

### Frontend Next.js

```bash
cd apps/web
npm install
npm run dev
```
