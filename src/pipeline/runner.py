from __future__ import annotations

from dataclasses import replace
from typing import Iterable

from pipeline.models import RawWatchListing
from pipeline.queue import DeadLetterQueue, InMemoryQueue
from pipeline.sinks import InMemoryDatabase, InMemoryRedisCache
from pipeline.sla import PipelineSLA
from pipeline.stages.collect import SourceConnector
from pipeline.stages.deduplicate import Deduplicator
from pipeline.stages.enrich import Enricher
from pipeline.stages.normalize import Normalizer
from pipeline.stages.score import OpportunityScorer


class PipelineRunner:
    def __init__(
        self,
        connectors: Iterable[SourceConnector],
        normalizer: Normalizer,
        deduplicator: Deduplicator,
        enricher: Enricher,
        scorer: OpportunityScorer,
        database: InMemoryDatabase,
        redis_cache: InMemoryRedisCache,
    ) -> None:
        self.connectors = list(connectors)
        self.normalizer = normalizer
        self.deduplicator = deduplicator
        self.enricher = enricher
        self.scorer = scorer
        self.database = database
        self.redis_cache = redis_cache

        self.ingestion_queue: InMemoryQueue[RawWatchListing] = InMemoryQueue()
        self.dlq: DeadLetterQueue[dict] = DeadLetterQueue()
        self.sla = PipelineSLA()

    def run(self) -> None:
        self.collect()
        self.process_queue()

    def collect(self) -> None:
        for connector in self.connectors:
            try:
                records = list(connector.fetch())
                self.ingestion_queue.extend(records)
                self.sla.record_source_success(len(records))
            except Exception as exc:
                self.sla.record_source_failure()
                self.dlq.publish({"stage": "collect", "source": connector.source_name, "error": str(exc)})

    def process_queue(self) -> None:
        while True:
            msg = self.ingestion_queue.consume()
            if msg is None:
                return

            raw = msg.payload
            try:
                normalized = self.normalizer.normalize(raw)
                if self.deduplicator.is_duplicate(normalized):
                    continue
                enriched = self.enricher.enrich(normalized)
                scored = replace(enriched, opportunity_score=self.scorer.score(enriched))

                self.database.upsert(scored)
                self.redis_cache.set_listing(scored)
                self.sla.record_processed(scored.ingested_at)
            except Exception as exc:
                self.dlq.publish(
                    {
                        "stage": "process_queue",
                        "source": raw.source,
                        "external_id": raw.external_id,
                        "error": str(exc),
                    }
                )
