# WatchFlow (concept)

Plateforme communautaire pour **acheter, vendre, échanger et entretenir des montres**.

Ce dépôt contient un plan concret pour lancer une V1 **gratuitement** (ou quasi gratuitement) avec une architecture disponible et évolutive.

## Documents

- `docs/deploiement-gratuit.md` : comment publier maintenant, étape par étape.
- `docs/plateforme-complete.md` : produit complet (marketplace, réseau social, entretien, réparations, marges).
- `docs/roadmap-90-jours.md` : feuille de route claire pour sortir une plateforme utilisable rapidement.

## Principe clé

1. Démarrer avec une stack gratuite : **Cloudflare Pages + Supabase + Cloudflare R2**.
2. Mettre les fonctions sensibles côté serveur (paiements, marges, arbitrage litiges).
3. Monétiser via commissions services (réparations, nettoyage, sourcing boîtes/papiers), pas via abonnement obligatoire.
