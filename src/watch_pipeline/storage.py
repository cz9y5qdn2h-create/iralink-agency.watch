from __future__ import annotations

from dataclasses import dataclass, field

from .models import OpportunityScore


@dataclass(slots=True)
class Repository:
    records: list[OpportunityScore] = field(default_factory=list)

    def upsert(self, score: OpportunityScore) -> None:
        self.records.append(score)


@dataclass(slots=True)
class RedisCache:
    store: dict[str, dict] = field(default_factory=dict)

    def set_listing(self, key: str, value: dict) -> None:
        self.store[key] = value


@dataclass(slots=True)
class StorageWriter:
    repository: Repository
    cache: RedisCache

    def write(self, score: OpportunityScore) -> None:
        self.repository.upsert(score)
        cache_key = f"listing:{score.listing.normalized.external_id}"
        self.cache.set_listing(
            cache_key,
            {
                "brand": score.listing.normalized.brand,
                "model": score.listing.normalized.model,
                "score": score.score,
                "confidence": score.confidence,
            },
        )
