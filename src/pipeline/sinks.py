from __future__ import annotations

from pipeline.models import EnrichedWatchListing


class InMemoryDatabase:
    def __init__(self) -> None:
        self.rows: list[EnrichedWatchListing] = []

    def upsert(self, item: EnrichedWatchListing) -> None:
        self.rows.append(item)


class InMemoryRedisCache:
    def __init__(self) -> None:
        self.store: dict[str, dict] = {}

    def set_listing(self, item: EnrichedWatchListing) -> None:
        key = f"listing:{item.normalized_model}:{item.external_id}"
        self.store[key] = {
            "price_eur": item.price_eur,
            "opportunity_score": item.opportunity_score,
            "liquidity_score": item.liquidity_score,
            "volatility_score": item.volatility_score,
        }
