from __future__ import annotations

from dataclasses import dataclass
from statistics import mean

from .models import EnrichedListing, OpportunityScore


@dataclass(slots=True)
class OpportunityScorer:
    """Scoring heuristique; remplacable par la logique de la tâche scoring dédiée."""

    def score(self, listing: EnrichedListing) -> OpportunityScore:
        avg_price = mean(listing.price_history_30d)
        discount = max(0.0, (avg_price - listing.normalized.price_eur) / max(avg_price, 1.0))
        liquidity_boost = listing.liquidity_score * 0.25
        volatility_penalty = min(0.2, listing.volatility_30d)

        raw = discount * 0.65 + liquidity_boost - volatility_penalty
        score = max(0.0, min(1.0, raw))

        rationale = [
            f"discount_vs_30d={discount:.3f}",
            f"liquidity={listing.liquidity_score:.3f}",
            f"volatility={listing.volatility_30d:.3f}",
        ]
        confidence = max(0.4, 1 - listing.volatility_30d)

        return OpportunityScore(listing=listing, score=round(score, 4), confidence=round(confidence, 4), rationale=rationale)
