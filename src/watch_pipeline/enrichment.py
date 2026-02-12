from __future__ import annotations

from dataclasses import dataclass
from statistics import mean, pstdev

from .models import EnrichedListing, NormalizedListing


@dataclass(slots=True)
class MarketDataProvider:
    """Provider simplifié: brancher ici une base TSDB, ClickHouse, etc."""

    def get_price_history(self, listing: NormalizedListing) -> list[float]:
        anchor = listing.price_eur
        return [round(anchor * (0.9 + i * 0.01), 2) for i in range(30)]

    def get_liquidity(self, listing: NormalizedListing) -> float:
        base = 0.8 if listing.brand.lower() in {"rolex", "patek philippe", "audemars piguet"} else 0.55
        return min(1.0, max(0.0, base))


@dataclass(slots=True)
class ListingEnricher:
    provider: MarketDataProvider

    def enrich(self, listing: NormalizedListing) -> EnrichedListing:
        history = self.provider.get_price_history(listing)
        volatility = 0.0 if len(history) < 2 else pstdev(history) / max(mean(history), 1)
        return EnrichedListing(
            normalized=listing,
            price_history_30d=history,
            liquidity_score=self.provider.get_liquidity(listing),
            volatility_30d=round(volatility, 4),
        )
