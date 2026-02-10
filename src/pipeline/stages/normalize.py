from __future__ import annotations

from dataclasses import dataclass

from pipeline.models import NormalizedWatchListing, RawWatchListing


@dataclass
class NormalizationRules:
    fx_rates_to_eur: dict[str, float]
    model_aliases: dict[str, str]
    condition_aliases: dict[str, str]


class Normalizer:
    def __init__(self, rules: NormalizationRules) -> None:
        self.rules = rules

    def normalize(self, raw: RawWatchListing) -> NormalizedWatchListing:
        currency = raw.currency.upper()
        if currency not in self.rules.fx_rates_to_eur:
            raise ValueError(f"Unsupported currency: {currency}")

        condition_key = raw.condition.strip().lower()
        normalized_condition = self.rules.condition_aliases.get(condition_key, "unknown")

        model_key = f"{raw.brand} {raw.model}".strip().lower()
        normalized_model = self.rules.model_aliases.get(model_key, model_key)

        return NormalizedWatchListing(
            source=raw.source,
            external_id=raw.external_id,
            brand=raw.brand.strip().title(),
            model=raw.model.strip(),
            normalized_model=normalized_model,
            condition=raw.condition,
            normalized_condition=normalized_condition,
            price_eur=round(raw.price * self.rules.fx_rates_to_eur[currency], 2),
            original_price=raw.price,
            original_currency=currency,
            url=raw.url,
            ingested_at=raw.scraped_at,
        )
