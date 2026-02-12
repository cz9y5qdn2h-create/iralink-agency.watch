# Publication gratuite "là, là" (immédiatement)

Objectif : mettre une V1 en ligne avec un coût initial ~0€.

## Stack recommandée (gratuite)

- **Front web** : Cloudflare Pages (plan gratuit).
- **API + Auth + DB** : Supabase (plan gratuit).
- **Stockage images** : Cloudflare R2 (palier gratuit) ou Supabase Storage.
- **Emails transactionnels** : Resend (free tier) ou Brevo.
- **Observabilité** : Sentry (free tier).

> Pourquoi ce choix : setup simple, très rapide, fiable, et parfait pour une V1 marketplace.

---

## Étape 1 — Créer les comptes (30 min)

1. Créer un projet **Supabase**.
2. Créer un compte **Cloudflare** puis activer **Pages**.
3. (Optionnel) Créer un bucket **R2** pour les photos de montres.
4. Créer un compte **Sentry**.

---

## Étape 2 — Schéma DB minimum (Supabase)

Créer ces tables :

- `users` : profil utilisateur, rôle, KYC status.
- `watch_listings` : annonces (prix, état, marque, modèle, référence, localisation).
- `listing_images` : photos attachées.
- `offers` : offres d'achat / contre-offres.
- `orders` : transactions validées.
- `services` : entretien/réparation/nettoyage/sourcing accessoires.
- `service_orders` : demandes de service.
- `messages` : messagerie acheteur-vendeur.
- `reviews` : réputation vendeur/réparateur.

Activer :

- **RLS (Row Level Security)** sur toutes les tables sensibles.
- Index sur `watch_listings(brand, reference, price)` et `messages(conversation_id, created_at)`.

---

## Étape 3 — Déployer le frontend (Cloudflare Pages)

1. Pousser le code sur GitHub.
2. Cloudflare Pages → `Create project` → connecter le repo.
3. Build command (exemple Next.js) : `npm run build`
4. Output directory : `.next` (ou config framework auto).
5. Ajouter les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement)

À ce stade, le site est en ligne avec URL Cloudflare.

---

## Étape 4 — Domaine custom + HTTPS

1. Acheter un domaine (ou utiliser sous-domaine gratuit).
2. Lier le domaine à Cloudflare Pages.
3. SSL/TLS en mode `Full`.
4. Activer cache statique + compression.

---

## Étape 5 — Publier la partie API / logique métier

Option A (simple) : Supabase Edge Functions.

Utiliser des fonctions pour :

- escrow logique (validation paiement/release)
- calcul commission
- routage de demandes de service vers réparateurs privés
- génération de devis

Option B : Cloudflare Workers si besoin de logique plus avancée.

---

## Étape 6 — Paiement & marges (important)

Utiliser **Stripe Connect** (en commençant en sandbox) :

- Flux marketplace : vendeur reçoit, plateforme prélève commission.
- Flux services : réparation/entretien sous-traité, plateforme prend frais de traitement.
- Gestion remboursements/litiges centralisée.

---

## Étape 7 — Disponibilité et fiabilité

1. Monitorings : Sentry + uptime check.
2. Sauvegardes DB automatiques Supabase.
3. Limites anti-abus : rate-limit API + captcha création annonces.
4. Modération annonces (texte + images).

---

## Étape 8 — Lancement public (gratuit)

Checklist pré-lancement :

- [ ] Inscription + connexion OK
- [ ] Création d'annonce + upload photos OK
- [ ] Messagerie OK
- [ ] Paiement test OK
- [ ] Création ticket entretien/réparation OK
- [ ] RLS testée (pas d'accès croisé données)

Puis :

- ouvrir inscriptions,
- communiquer dans communautés horlogères,
- lancer programme "1 nettoyage offert / 10 ans" comme avantage fidélité.

---

## Coût de départ réaliste

- Hébergement front : 0€
- DB/Auth/API de base : 0€ (limites free tier)
- Monitoring : 0€
- Paiements : frais à la transaction seulement

Tu peux donc publier rapidement sans frais fixes élevés.
