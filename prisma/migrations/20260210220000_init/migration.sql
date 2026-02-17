-- Create enums
CREATE TYPE "listing_condition" AS ENUM ('NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR');
CREATE TYPE "alert_type" AS ENUM ('PRICE_BELOW', 'PRICE_ABOVE', 'NEW_LISTING');

-- Base catalog
CREATE TABLE "brands" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "models" (
  "id" BIGSERIAL PRIMARY KEY,
  "brand_id" BIGINT NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "models_brand_id_name_key" UNIQUE ("brand_id", "name")
);

CREATE TABLE "references" (
  "id" BIGSERIAL PRIMARY KEY,
  "model_id" BIGINT NOT NULL REFERENCES "models"("id") ON DELETE CASCADE,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Market data
CREATE TABLE "listings" (
  "id" BIGSERIAL PRIMARY KEY,
  "reference_id" BIGINT NOT NULL REFERENCES "references"("id") ON DELETE CASCADE,
  "source" TEXT NOT NULL,
  "marketplace" TEXT NOT NULL,
  "external_listing_id" TEXT NOT NULL,
  "price" NUMERIC(18,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "condition" "listing_condition" NOT NULL,
  "observed_at" TIMESTAMPTZ NOT NULL,
  "listing_date" TIMESTAMPTZ,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "listings_marketplace_external_listing_id_key" UNIQUE ("marketplace", "external_listing_id")
);

CREATE TABLE "price_history" (
  "id" BIGSERIAL PRIMARY KEY,
  "reference_id" BIGINT NOT NULL REFERENCES "references"("id") ON DELETE CASCADE,
  "observed_at" TIMESTAMPTZ NOT NULL,
  "min_price" NUMERIC(18,2),
  "max_price" NUMERIC(18,2),
  "avg_price" NUMERIC(18,2),
  "sample_size" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User and alerting
CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'fr',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "watchlists" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reference_id" BIGINT NOT NULL REFERENCES "references"("id") ON DELETE CASCADE,
  "name" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "watchlists_user_id_reference_id_key" UNIQUE ("user_id", "reference_id")
);

CREATE TABLE "alerts" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" BIGINT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "watchlist_id" BIGINT REFERENCES "watchlists"("id") ON DELETE SET NULL,
  "type" "alert_type" NOT NULL,
  "threshold" NUMERIC(18,2),
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "source_trust_scores" (
  "id" BIGSERIAL PRIMARY KEY,
  "source" TEXT NOT NULL UNIQUE,
  "score" NUMERIC(5,2) NOT NULL,
  "confidence" NUMERIC(5,2),
  "reason" TEXT,
  "evaluated_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing rules
CREATE INDEX "listings_reference_id_observed_at_idx" ON "listings" ("reference_id", "observed_at");
CREATE INDEX "price_history_reference_id_observed_at_idx" ON "price_history" ("reference_id", "observed_at");
