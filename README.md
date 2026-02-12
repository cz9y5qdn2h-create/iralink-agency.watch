# iralink-agency.watch

Site statique prêt pour publication avec domaine personnalisé `https://iralink-agency`.

## Déploiement du site statique (GitHub Pages)

1. Pousser ce dépôt sur GitHub.
2. Activer **Settings → Pages** avec la source `Deploy from a branch` (`main`/`work`, dossier `/root`).
3. Le fichier `CNAME` configure automatiquement le domaine `iralink-agency`.
4. Dans le fournisseur DNS, créer l'enregistrement adapté vers GitHub Pages.

## Package Python (CI / sécurité)

Le dépôt inclut aussi un package `iralink-agency-watch` (FastAPI minimal) pour les pipelines qui exécutent `pip install .`.

- Le fichier `pyproject.toml` force `click>=8.1.8,<8.2.0` pour rester compatible avec les versions récentes de `semgrep`.
- Le workflow `.github/workflows/security.yml` installe `pip-audit` et `semgrep` avec `pipx` dans des environnements isolés pour éviter les conflits de dépendances (notamment `tomli`) et l'erreur `Could not find 'semgrep-core' executable`.

## Vérification locale

```bash
python3 -m http.server 4173
```

Puis ouvrir <http://localhost:4173>.

Pour tester le package Python:

```bash
python3 -m pip install .
python3 -m pip install pipx
pipx install pip-audit==2.10.0
pipx install semgrep==1.151.0
```
