from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .collectors import Collector
from .deduplication import ListingDeduplicator
from .enrichment import ListingEnricher, MarketDataProvider
from .messaging import DeadLetterQueue, InMemoryQueue
from .models import RawListing
from .normalization import ListingNormalizer
from .scoring import OpportunityScorer
from .sla import SlaTracker
from .storage import RedisCache, Repository, StorageWriter


@dataclass(slots=True)
class OpportunityPipeline:
    queue: InMemoryQueue[RawListing]
    dlq: DeadLetterQueue[RawListing]
    normalizer: ListingNormalizer
    deduplicator: ListingDeduplicator
    enricher: ListingEnricher
    scorer: OpportunityScorer
    writer: StorageWriter
    sla: SlaTracker

    @classmethod
    def default(cls, queue_provider: str = "redpanda") -> "OpportunityPipeline":
        return cls(
            queue=InMemoryQueue(name="watch-listings", provider=queue_provider),
            dlq=DeadLetterQueue(),
            normalizer=ListingNormalizer.default(),
            deduplicator=ListingDeduplicator(),
            enricher=ListingEnricher(provider=MarketDataProvider()),
            scorer=OpportunityScorer(),
            writer=StorageWriter(repository=Repository(), cache=RedisCache()),
            sla=SlaTracker(),
        )

    def collect(self, collector: Collector) -> int:
        count = 0
        for listing in collector.fetch():
            self.queue.publish(listing)
            count += 1
        return count

    def process_once(self) -> bool:
        raw = self.queue.consume()
        if raw is None:
            return False

        try:
            start = datetime.utcnow()
            normalized = self.normalizer.normalize(raw)
            if self.deduplicator.is_duplicate(normalized):
                self.sla.record_success(raw.source, 0.0, raw.collected_at)
                return True

            enriched = self.enricher.enrich(normalized)
            score = self.scorer.score(enriched)
            self.writer.write(score)

            latency = (datetime.utcnow() - start).total_seconds() * 1000
            self.sla.record_success(raw.source, latency, raw.collected_at)
            return True
        except Exception as exc:  # runtime safety
            self.dlq.put(raw, exc)
            self.sla.record_failure(raw.source)
            return True
