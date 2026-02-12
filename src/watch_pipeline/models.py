from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(slots=True)
class RawListing:
    source: str
    source_listing_id: str
    payload: dict[str, Any]
    collected_at: datetime = field(default_factory=datetime.utcnow)


@dataclass(slots=True)
class NormalizedListing:
    source: str
    external_id: str
    brand: str
    model: str
    reference: str
    condition: str
    price_eur: float
    currency_original: str
    price_original: float
    collected_at: datetime

    @property
    def dedup_key(self) -> str:
        return f"{self.brand.lower()}|{self.model.lower()}|{self.reference.lower()}"


@dataclass(slots=True)
class EnrichedListing:
    normalized: NormalizedListing
    price_history_30d: list[float]
    liquidity_score: float
    volatility_30d: float


@dataclass(slots=True)
class OpportunityScore:
    listing: EnrichedListing
    score: float
    confidence: float
    rationale: list[str]
