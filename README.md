# IL-Watch — Version production Hostinger (Vite + React + Express)

Cette version est pensée pour être **opérationnelle en production** avec une base moderne, maintenable et orientée conversion/SEO.

## Stack technique

- **Front-end** : Vite + React + React Router
- **SEO** : meta dynamiques par page (Helmet), Open Graph, Twitter Cards, JSON-LD, `robots.txt`, `sitemap.xml`
- **API** : Express + Helmet + Compression
- **Données MVP** : `db.json`

## Démarrage local

```bash
npm install
npm run server
npm run dev
```

- Front : `http://localhost:5173`
- API : `http://localhost:3000/api/health`

## Build production

```bash
npm run build
npm run server
```

Le serveur Express sert automatiquement le dossier `dist/`.

## SEO inclus

- Balises `title` et `description` spécifiques par page.
- Balises Open Graph et Twitter Cards.
- Données structurées JSON-LD (WebSite / CollectionPage).
- Fichiers `public/robots.txt` et `public/sitemap.xml`.
- URL canonique prévue sur `https://iralink-agency.watch`.

## Pages métiers

- `/` : accueil + tendances marché
- `/compte` : onboarding & résumé compte
- `/patrimoine` : portefeuille & ajout de montres
- `/formations` : academy gratuite
- `/marketplace` : catalogue, recherche et publication d'annonces
