from __future__ import annotations

from dataclasses import replace

from pipeline.models import EnrichedWatchListing, NormalizedWatchListing


class Enricher:
    def __init__(self, history_prices: dict[str, list[float]], liquidity: dict[str, float], volatility: dict[str, float]) -> None:
        self.history_prices = history_prices
        self.liquidity = liquidity
        self.volatility = volatility

    def enrich(self, item: NormalizedWatchListing) -> EnrichedWatchListing:
        history = self.history_prices.get(item.normalized_model, [])
        avg = round(sum(history) / len(history), 2) if history else None
        liquidity_score = self.liquidity.get(item.normalized_model, 0.2)
        volatility_score = self.volatility.get(item.normalized_model, 0.5)

        base = replace(item)
        return EnrichedWatchListing(
            **base.__dict__,
            historical_avg_price_eur=avg,
            liquidity_score=liquidity_score,
            volatility_score=volatility_score,
        )
