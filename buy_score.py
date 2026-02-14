from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from statistics import fmean


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


class RiskProfile(str, Enum):
    PRUDENT = "prudent"
    EQUILIBRE = "equilibre"
    AGRESSIF = "agressif"


@dataclass(frozen=True)
class UserThresholds:
    median_discount_min: float
    momentum_min: float
    volatility_max: float
    liquidity_min: float
    seller_reliability_min: float
    condition_bonus_accessories: float


DEFAULT_THRESHOLDS: dict[RiskProfile, UserThresholds] = {
    RiskProfile.PRUDENT: UserThresholds(
        median_discount_min=0.08,
        momentum_min=0.01,
        volatility_max=0.06,
        liquidity_min=20,
        seller_reliability_min=0.90,
        condition_bonus_accessories=1.0,
    ),
    RiskProfile.EQUILIBRE: UserThresholds(
        median_discount_min=0.05,
        momentum_min=0.0,
        volatility_max=0.10,
        liquidity_min=12,
        seller_reliability_min=0.80,
        condition_bonus_accessories=0.7,
    ),
    RiskProfile.AGRESSIF: UserThresholds(
        median_discount_min=0.02,
        momentum_min=-0.02,
        volatility_max=0.15,
        liquidity_min=6,
        seller_reliability_min=0.70,
        condition_bonus_accessories=0.4,
    ),
}


@dataclass(frozen=True)
class ListingInput:
    listing_price: float
    median_30d_price: float
    median_90d_price: float
    short_term_momentum: float
    volatility: float
    listing_volume: int
    seller_reliability_score: float
    condition_score: float
    has_box: bool
    has_papers: bool


@dataclass(frozen=True)
class BuyScoreResult:
    buy_score: int
    explanations: list[str]


def _normalize_price_advantage(listing_price: float, median: float) -> float:
    if median <= 0:
        return 0.5
    # Positive value means listing is below median.
    advantage = (median - listing_price) / median
    return _clamp((advantage + 0.20) / 0.40, 0.0, 1.0)


def _normalize_momentum(momentum: float) -> float:
    # -10% to +10% mapped to 0..1
    return _clamp((momentum + 0.10) / 0.20, 0.0, 1.0)


def _normalize_volatility(volatility: float) -> float:
    # Lower volatility is better.
    return _clamp(1.0 - volatility / 0.30, 0.0, 1.0)


def _normalize_liquidity(volume: int) -> float:
    return _clamp(volume / 30.0, 0.0, 1.0)


def _normalize_condition(condition_score: float, has_box: bool, has_papers: bool, accessory_weight: float) -> float:
    accessory_bonus = (float(has_box) + float(has_papers)) * 0.1 * accessory_weight
    return _clamp(condition_score + accessory_bonus, 0.0, 1.0)


def compute_buy_score(
    payload: ListingInput,
    profile: RiskProfile = RiskProfile.EQUILIBRE,
    overrides: UserThresholds | None = None,
) -> BuyScoreResult:
    thresholds = overrides or DEFAULT_THRESHOLDS[profile]

    p30_adv = (payload.median_30d_price - payload.listing_price) / payload.median_30d_price if payload.median_30d_price else 0.0
    p90_adv = (payload.median_90d_price - payload.listing_price) / payload.median_90d_price if payload.median_90d_price else 0.0

    price_component = fmean(
        [
            _normalize_price_advantage(payload.listing_price, payload.median_30d_price),
            _normalize_price_advantage(payload.listing_price, payload.median_90d_price),
        ]
    )

    momentum_component = _normalize_momentum(payload.short_term_momentum)
    volatility_component = _normalize_volatility(payload.volatility)
    liquidity_component = _normalize_liquidity(payload.listing_volume)
    seller_component = _clamp(payload.seller_reliability_score, 0.0, 1.0)
    condition_component = _normalize_condition(
        payload.condition_score,
        payload.has_box,
        payload.has_papers,
        thresholds.condition_bonus_accessories,
    )

    weighted_total = (
        price_component * 0.28
        + momentum_component * 0.16
        + volatility_component * 0.15
        + liquidity_component * 0.12
        + seller_component * 0.19
        + condition_component * 0.10
    )

    buy_score = int(round(_clamp(weighted_total * 100.0)))

    explanations = [
        f"Sous le médian 30j de {p30_adv * 100:.0f}%" if p30_adv >= 0 else f"Au-dessus du médian 30j de {abs(p30_adv) * 100:.0f}%",
        f"Sous le médian 90j de {p90_adv * 100:.0f}%" if p90_adv >= 0 else f"Au-dessus du médian 90j de {abs(p90_adv) * 100:.0f}%",
        "Momentum court terme favorable" if payload.short_term_momentum >= thresholds.momentum_min else "Momentum court terme faible",
        "Volatilité faible" if payload.volatility <= thresholds.volatility_max else "Volatilité élevée",
        f"Liquidité annonces: {payload.listing_volume}",
        f"Vendeur fiable score {payload.seller_reliability_score:.2f}",
        f"État noté {payload.condition_score:.2f}"
        + (" + boîte" if payload.has_box else "")
        + (" + papiers" if payload.has_papers else ""),
    ]

    # Soft penalties against user thresholds for personalization.
    if p90_adv < thresholds.median_discount_min:
        buy_score = max(0, buy_score - 8)
    if payload.listing_volume < thresholds.liquidity_min:
        buy_score = max(0, buy_score - 6)
    if payload.seller_reliability_score < thresholds.seller_reliability_min:
        buy_score = max(0, buy_score - 12)

    return BuyScoreResult(buy_score=buy_score, explanations=explanations)
