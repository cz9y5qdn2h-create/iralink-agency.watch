# Pipeline opportunités montres

Implémentation d'un pipeline en étapes avec queue, DLQ, orchestration et métriques SLA.

## Étapes implémentées

1. **Collecte** via connecteurs API + scraping légal (`APIMarketCollector`, `LegalScrapingCollector`) vers une queue configurable (`kafka`, `redpanda`, `sqs`).
2. **Normalisation** des devises, aliases de modèles et états de montre.
3. **Déduplication** hybride (external IDs + fuzzy matching `SequenceMatcher`).
4. **Enrichissement** (historique 30j, liquidité du modèle, volatilité).
5. **Scoring d'opportunité** (discount vs historique, liquidité, pénalité de volatilité).
6. **Écriture** en base (repository) + cache Redis (abstraction `RedisCache`) pour requêtes rapides.

## Résilience / exploitation

- **DLQ**: tout échec de traitement est routé vers `DeadLetterQueue` avec message d'erreur.
- **Orchestration Airflow**: `src/watch_pipeline/orchestration/airflow_dag.py`
- **Orchestration Temporal**: `src/watch_pipeline/orchestration/temporal_workflow.py`

## SLA mesurés

Le `SlaTracker` suit:

- **Latence d'ingestion** (`ingestion_latency_ms`)
- **Taux d'échec par source** (`failure_rate(source)`)
- **Fraîcheur des données** (`data_freshness_seconds(source, now)`)

## Lancer les tests

```bash
python -m pytest
```
