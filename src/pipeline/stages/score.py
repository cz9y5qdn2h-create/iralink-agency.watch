from __future__ import annotations

from pipeline.models import EnrichedWatchListing


class OpportunityScorer:
    """Score d'opportunité (placeholder raccordable à la tâche scoring dédiée)."""

    def score(self, item: EnrichedWatchListing) -> float:
        if item.historical_avg_price_eur and item.historical_avg_price_eur > 0:
            discount = max(0.0, (item.historical_avg_price_eur - item.price_eur) / item.historical_avg_price_eur)
        else:
            discount = 0.0

        score = (
            0.55 * discount
            + 0.30 * item.liquidity_score
            + 0.15 * (1.0 - min(1.0, item.volatility_score))
        )
        return round(score * 100, 2)
