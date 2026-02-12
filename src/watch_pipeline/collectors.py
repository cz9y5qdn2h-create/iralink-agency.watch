from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from .models import RawListing


class Collector(Protocol):
    source_name: str

    def fetch(self) -> list[RawListing]:
        ...


@dataclass(slots=True)
class APIMarketCollector:
    source_name: str = "market-api"

    def fetch(self) -> list[RawListing]:
        # Exemple: remplacer par client REST authentifié.
        return [
            RawListing(
                source=self.source_name,
                source_listing_id="api-001",
                payload={
                    "brand": "Rolex",
                    "model": "Sub",
                    "reference": "126610LN",
                    "currency": "USD",
                    "price": 10200,
                    "condition": "mint",
                },
                collected_at=datetime.utcnow(),
            )
        ]


@dataclass(slots=True)
class LegalScrapingCollector:
    source_name: str = "legal-scraper"

    def fetch(self) -> list[RawListing]:
        # Exemple: scraper respectant robots.txt + ToS.
        return [
            RawListing(
                source=self.source_name,
                source_listing_id="scr-301",
                payload={
                    "brand": "Omega",
                    "model": "Speedmaster",
                    "reference": "310.30.42.50.01.001",
                    "currency": "EUR",
                    "price": 5500,
                    "condition": "very good",
                },
                collected_at=datetime.utcnow(),
            )
        ]
