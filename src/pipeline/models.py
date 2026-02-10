from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


@dataclass
class RawWatchListing:
    source: str
    external_id: str
    brand: str
    model: str
    condition: str
    price: float
    currency: str
    url: str
    scraped_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class NormalizedWatchListing:
    source: str
    external_id: str
    brand: str
    model: str
    normalized_model: str
    condition: str
    normalized_condition: str
    price_eur: float
    original_price: float
    original_currency: str
    url: str
    ingested_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class EnrichedWatchListing(NormalizedWatchListing):
    historical_avg_price_eur: Optional[float] = None
    liquidity_score: float = 0.0
    volatility_score: float = 0.0
    opportunity_score: float = 0.0
