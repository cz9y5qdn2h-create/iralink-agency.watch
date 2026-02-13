# IL-Watch — Version production Hostinger (Vite + React + Express)

Cette version est pensée pour être **opérationnelle en production** sur Hostinger.

## Stack technique

- **Front-end** : Vite + React + React Router
- **SEO** : meta dynamiques par page (Helmet), Open Graph, Twitter Cards, JSON-LD, `robots.txt`, `sitemap.xml`
- **API** : Express + Helmet + Compression
- **Données MVP** : `db.json` avec fallback mémoire si écriture disque indisponible

## Démarrage local

```bash
npm install
npm run start
```

Puis ouvre `http://localhost:3000`.

## Développement

```bash
npm install
npm run server
npm run dev
```

- Front : `http://localhost:5173`
- API : `http://localhost:3000/api/health`

## Production (Hostinger)

Scripts prêts :

- `npm start` : démarre l’app en prod (`node server.js`)
- `postinstall` : build auto du front (`npm run build`) pour garantir que `dist/` existe

Donc en déploiement Node :
1. Commande d’installation : `npm install`
2. Commande de démarrage : `npm start`

## SEO inclus

- Balises `title` et `description` spécifiques par page.
- Balises Open Graph et Twitter Cards.
- Données structurées JSON-LD (WebSite / CollectionPage).
- Fichiers `public/robots.txt` et `public/sitemap.xml`.
- URL canonique prévue sur `https://iralink-agency.watch`.

## Pages métiers

- `/` : accueil + tendances marché
- `/compte` : onboarding & résumé compte
- `/patrimoine` : portefeuille + ajout de montres
- `/formations` : academy gratuite
- `/marketplace` : catalogue, recherche et publication d’annonces
