# IL-Watch — Refonte Hostinger (Vite + React + Express)

Cette version a été entièrement refaite pour rester alignée avec les frameworks officiellement supportés par Hostinger.

## Stack

- **Front-end**: Vite + React + React Router
- **API**: Express.js
- **Données**: `db.json` (fichier local, simple pour MVP)

## Lancer en local

```bash
npm install
npm run server
npm run dev
```

- Front-end: `http://localhost:5173`
- API: `http://localhost:3000/api/health`

## Build production

```bash
npm run build
npm run server
```

Le serveur Express sert automatiquement `dist/` lorsqu'il existe.

## Pages incluses

- `/` : dashboard d'accueil
- `/compte` : onboarding + résumé compte
- `/patrimoine` : portefeuille + ajout de montres
- `/formations` : formations gratuites
- `/marketplace` : annonces + publication
