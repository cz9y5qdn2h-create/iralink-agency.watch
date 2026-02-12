from __future__ import annotations

from dataclasses import dataclass

from .models import NormalizedListing, RawListing


FX_RATES_TO_EUR = {
    "EUR": 1.0,
    "USD": 0.92,
    "CHF": 1.04,
    "GBP": 1.17,
}

MODEL_ALIASES = {
    "sub": "submariner",
    "gmt m2": "gmt-master ii",
    "nautilus 5711/1a": "nautilus 5711",
}

CONDITION_MAP = {
    "new": "new",
    "nos": "new old stock",
    "mint": "excellent",
    "very good": "very_good",
    "good": "good",
    "fair": "fair",
}


@dataclass(slots=True)
class ListingNormalizer:
    fx_rates: dict[str, float]

    @classmethod
    def default(cls) -> "ListingNormalizer":
        return cls(fx_rates=FX_RATES_TO_EUR)

    def normalize(self, raw: RawListing) -> NormalizedListing:
        p = raw.payload
        currency = str(p["currency"]).upper()
        amount = float(p["price"])
        price_eur = amount * self.fx_rates.get(currency, 1.0)

        model = str(p["model"]).strip().lower()
        model = MODEL_ALIASES.get(model, model)

        condition_raw = str(p.get("condition", "good")).strip().lower()
        condition = CONDITION_MAP.get(condition_raw, condition_raw.replace(" ", "_"))

        return NormalizedListing(
            source=raw.source,
            external_id=raw.source_listing_id,
            brand=str(p["brand"]).strip(),
            model=model,
            reference=str(p.get("reference", "unknown")).strip(),
            condition=condition,
            price_eur=round(price_eur, 2),
            currency_original=currency,
            price_original=amount,
            collected_at=raw.collected_at,
        )
