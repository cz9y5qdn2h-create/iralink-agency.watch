# iralink-agency.watch — Pipeline d'ingestion en étapes

Ce dépôt contient une implémentation de référence d'un pipeline data orienté montres de luxe avec :

1. **Collecte** via connecteurs API/scraping légal vers une queue compatible **Kafka/Redpanda/SQS**.
2. **Normalisation** (devises, noms de modèles, état de montre).
3. **Déduplication** (fuzzy matching + external IDs).
4. **Enrichissement** (historique prix, liquidité, volatilité).
5. **Scoring d'opportunité**.
6. **Écriture en base** + **cache Redis**.

Le pipeline inclut :
- **Orchestration Airflow** (DAG fourni),
- **DLQ** pour les erreurs de traitement,
- **Mesure SLA** : latence ingestion, taux d'échec source, fraîcheur des données.

## Structure

- `src/pipeline/stages/` : implémentation des étapes métier.
- `src/pipeline/queue.py` : abstraction queue + DLQ.
- `src/pipeline/sinks.py` : persistance (DB) et cache Redis (in-memory pour l'exemple).
- `src/pipeline/sla.py` : métriques SLA.
- `src/pipeline/orchestration/airflow_dag.py` : orchestration Airflow.
- `src/pipeline/runner.py` : exécution de bout en bout du pipeline.
- `tests/` : tests unitaires des étapes clés.

## Exécution des tests

```bash
python -m unittest discover -s tests
```

## Notes d'intégration réelle

- **Queue**: remplacer `InMemoryQueue` par un producteur/consommateur Kafka (Redpanda) ou SQS.
- **DLQ**: brancher sur un topic/queue dédiée (`watch-items-dlq`).
- **DB/Redis**: remplacer les stores in-memory par PostgreSQL + Redis.
- **Airflow**: importer `watch_pipeline_dag` dans votre scheduler.
