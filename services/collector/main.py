from dataclasses import dataclass


@dataclass
class MarketplacePrice:
    source: str
    watch_reference: str
    price_eur: float


def collect_prices() -> list[MarketplacePrice]:
    """Mock de collecte de prix marketplaces."""
    return [
        MarketplacePrice(source="chrono24", watch_reference="126610LN", price_eur=11700),
        MarketplacePrice(source="ebay", watch_reference="126610LN", price_eur=12100),
    ]
