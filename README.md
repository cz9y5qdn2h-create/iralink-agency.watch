# iralink-agency.watch

Site statique prêt pour publication avec domaine personnalisé `https://iralink-agency`.

## Déploiement recommandé (GitHub Pages)

1. Pousser ce dépôt sur GitHub.
2. Activer **Settings → Pages** avec la source `Deploy from a branch` (`main`/`work`, dossier `/root`).
3. Le fichier `CNAME` configure automatiquement le domaine `iralink-agency`.
4. Dans le fournisseur DNS, créer l'enregistrement adapté vers GitHub Pages.

## Vérification locale

```bash
python3 -m http.server 4173
```

Puis ouvrir <http://localhost:4173>.
