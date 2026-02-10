# PostgreSQL managé - baseline production

Cette base est conçue pour être déployée sur un PostgreSQL managé (AWS RDS/Aurora, GCP Cloud SQL, ou Supabase Enterprise) avec exigences sécurité et résilience.

## Exigences d'infrastructure

- **Chiffrement au repos (KMS)**
  - AWS: `storage_encrypted = true` + KMS CMK.
  - GCP: CMEK Cloud KMS sur l'instance Cloud SQL.
  - Supabase Enterprise: chiffrement au repos activé (BYOK/KMS selon contrat).
- **TLS obligatoire en transit**
  - Forcer SSL côté serveur (`rds.force_ssl=1`, `require_ssl=on`, ou paramètre équivalent).
  - Côté application, utiliser un `DATABASE_URL` avec `sslmode=require` (ou `verify-full` si CA gérée).
- **Sauvegardes automatiques + PITR**
  - Activer les backups automatiques.
  - Configurer une fenêtre de rétention compatible RPO/RTO (ex: 14 à 35 jours).
  - Vérifier que le Point-In-Time Recovery est activé et testé.
- **Réplication lecture (analytics)**
  - Créer au moins un read replica dédié analytics/BI.
  - Router les requêtes analytiques vers le replica (pas vers le writer primaire).
- **Rotation des secrets**
  - Gérer les credentials DB via AWS Secrets Manager, GCP Secret Manager (+ scheduler/rotation), ou Vault.
  - Rotation automatique périodique + redéploiement contrôlé des consommateurs.

## Variables d'environnement recommandées

```bash
# Writer (transactions)
DATABASE_URL="postgresql://app_user:${DB_PASSWORD}@db-writer.example:5432/app?schema=public&sslmode=require"

# Reader (analytics)
DATABASE_READ_URL="postgresql://app_reader:${DB_PASSWORD}@db-reader.example:5432/app?schema=public&sslmode=require"
```

## Migrations versionnées

- Les migrations Prisma sont stockées dans `prisma/migrations`.
- Migration initiale: `20260210220000_init`.
- Pour appliquer:

```bash
npx prisma migrate deploy
```

