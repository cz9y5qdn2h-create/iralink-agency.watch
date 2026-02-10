from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Dict, List, Literal, Optional

RiskProfileName = Literal["prudent", "equilibre", "agressif"]


@dataclass(frozen=True)
class UserThresholds:
    """Paramètres configurables appliqués au calcul du buy_score."""

    under_median_cap_pct: float
    over_median_cap_pct: float
    momentum_neutral_pct: float
    volatility_low_pct: float
    volatility_high_pct: float
    low_liquidity_volume: int
    high_liquidity_volume: int
    accessories_bonus: float


@dataclass(frozen=True)
class WeightConfig:
    price_vs_median: float
    momentum: float
    volatility: float
    liquidity: float
    seller_reliability: float
    condition_accessories: float


@dataclass(frozen=True)
class UserProfile:
    name: RiskProfileName
    thresholds: UserThresholds
    weights: WeightConfig


@dataclass(frozen=True)
class ListingSignals:
    current_price: float
    median_30d: float
    median_90d: float
    momentum_14d_pct: float
    volatility_30d_pct: float
    listing_volume_30d: int
    seller_reliability: float
    condition_score: float
    has_box: bool = False
    has_papers: bool = False


@dataclass(frozen=True)
class BuyScoreResult:
    buy_score: int
    explanations: List[str]
    component_scores: Dict[str, float]
    profile: UserProfile


DEFAULT_PROFILES: Dict[RiskProfileName, UserProfile] = {
    "prudent": UserProfile(
        name="prudent",
        thresholds=UserThresholds(
            under_median_cap_pct=20,
            over_median_cap_pct=15,
            momentum_neutral_pct=0.0,
            volatility_low_pct=4.5,
            volatility_high_pct=12.0,
            low_liquidity_volume=8,
            high_liquidity_volume=35,
            accessories_bonus=0.12,
        ),
        weights=WeightConfig(
            price_vs_median=0.30,
            momentum=0.10,
            volatility=0.20,
            liquidity=0.15,
            seller_reliability=0.15,
            condition_accessories=0.10,
        ),
    ),
    "equilibre": UserProfile(
        name="equilibre",
        thresholds=UserThresholds(
            under_median_cap_pct=18,
            over_median_cap_pct=18,
            momentum_neutral_pct=0.0,
            volatility_low_pct=6.0,
            volatility_high_pct=14.0,
            low_liquidity_volume=6,
            high_liquidity_volume=28,
            accessories_bonus=0.10,
        ),
        weights=WeightConfig(
            price_vs_median=0.27,
            momentum=0.14,
            volatility=0.15,
            liquidity=0.14,
            seller_reliability=0.15,
            condition_accessories=0.15,
        ),
    ),
    "agressif": UserProfile(
        name="agressif",
        thresholds=UserThresholds(
            under_median_cap_pct=14,
            over_median_cap_pct=24,
            momentum_neutral_pct=-1.0,
            volatility_low_pct=7.0,
            volatility_high_pct=17.0,
            low_liquidity_volume=4,
            high_liquidity_volume=20,
            accessories_bonus=0.07,
        ),
        weights=WeightConfig(
            price_vs_median=0.22,
            momentum=0.20,
            volatility=0.10,
            liquidity=0.15,
            seller_reliability=0.13,
            condition_accessories=0.20,
        ),
    ),
}


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _normalize_between(value: float, lower: float, upper: float) -> float:
    if lower == upper:
        return 1.0 if value >= upper else 0.0
    return _clamp01((value - lower) / (upper - lower))


def _price_component(signals: ListingSignals, thresholds: UserThresholds) -> tuple[float, str]:
    gap_90 = (signals.median_90d - signals.current_price) / signals.median_90d * 100
    gap_30 = (signals.median_30d - signals.current_price) / signals.median_30d * 100

    score_90 = _normalize_between(gap_90, -thresholds.over_median_cap_pct, thresholds.under_median_cap_pct)
    score_30 = _normalize_between(gap_30, -thresholds.over_median_cap_pct, thresholds.under_median_cap_pct)
    score = (score_90 * 0.65) + (score_30 * 0.35)

    reference = "90j" if abs(gap_90) >= abs(gap_30) else "30j"
    selected_gap = gap_90 if reference == "90j" else gap_30
    direction = "Sous" if selected_gap >= 0 else "Au-dessus"

    return score, f"{direction} le médian {reference} de {abs(selected_gap):.1f}%"


def _momentum_component(momentum_14d_pct: float, thresholds: UserThresholds) -> tuple[float, str]:
    neutral = thresholds.momentum_neutral_pct
    score = _normalize_between(momentum_14d_pct, neutral - 7, neutral + 7)

    if momentum_14d_pct >= neutral + 2:
        label = "Momentum court terme haussier"
    elif momentum_14d_pct <= neutral - 2:
        label = "Momentum court terme baissier"
    else:
        label = "Momentum court terme neutre"

    return score, f"{label} ({momentum_14d_pct:+.1f}% sur 14j)"


def _volatility_component(volatility_30d_pct: float, thresholds: UserThresholds) -> tuple[float, str]:
    low, high = thresholds.volatility_low_pct, thresholds.volatility_high_pct

    if volatility_30d_pct <= low:
        score, label = 1.0, "Volatilité faible"
    elif volatility_30d_pct >= high:
        score, label = 0.0, "Volatilité élevée"
    else:
        score = 1.0 - _normalize_between(volatility_30d_pct, low, high)
        label = "Volatilité modérée"

    return score, f"{label} ({volatility_30d_pct:.1f}% sur 30j)"


def _liquidity_component(volume_30d: int, thresholds: UserThresholds) -> tuple[float, str]:
    low, high = thresholds.low_liquidity_volume, thresholds.high_liquidity_volume
    score = _normalize_between(volume_30d, low, high)

    if volume_30d < low:
        label = "Liquidité faible"
    elif volume_30d > high:
        label = "Liquidité élevée"
    else:
        label = "Liquidité correcte"

    return score, f"{label} ({volume_30d} annonces / 30j)"


def _condition_component(signals: ListingSignals, thresholds: UserThresholds) -> tuple[float, str]:
    accessories = 0.0
    if signals.has_box:
        accessories += thresholds.accessories_bonus / 2
    if signals.has_papers:
        accessories += thresholds.accessories_bonus / 2

    score = _clamp01(signals.condition_score + accessories)

    details = []
    if signals.has_box:
        details.append("boîte")
    if signals.has_papers:
        details.append("papiers")

    extras = " + ".join(details) if details else "sans accessoires premium"
    return score, f"État/accessoires: {signals.condition_score:.2f} ({extras})"


def _seller_component(seller_reliability: float) -> tuple[float, str]:
    score = _clamp01(seller_reliability)
    return score, f"Vendeur fiable score {score:.2f}"


def _override_profile(base: UserProfile, override_thresholds: Optional[UserThresholds]) -> UserProfile:
    if override_thresholds is None:
        return base
    return replace(base, thresholds=override_thresholds)


def compute_buy_score(
    signals: ListingSignals,
    profile_name: RiskProfileName = "equilibre",
    override_thresholds: Optional[UserThresholds] = None,
) -> BuyScoreResult:
    """Retourne un buy_score (0..100) et une explication lisible.

    Le score est une somme pondérée de six composantes normalisées entre 0 et 1.
    """

    profile = _override_profile(DEFAULT_PROFILES[profile_name], override_thresholds)

    price_score, price_exp = _price_component(signals, profile.thresholds)
    momentum_score, momentum_exp = _momentum_component(signals.momentum_14d_pct, profile.thresholds)
    vol_score, vol_exp = _volatility_component(signals.volatility_30d_pct, profile.thresholds)
    liq_score, liq_exp = _liquidity_component(signals.listing_volume_30d, profile.thresholds)
    seller_score, seller_exp = _seller_component(signals.seller_reliability)
    cond_score, cond_exp = _condition_component(signals, profile.thresholds)

    components = {
        "price_vs_median": price_score,
        "momentum": momentum_score,
        "volatility": vol_score,
        "liquidity": liq_score,
        "seller_reliability": seller_score,
        "condition_accessories": cond_score,
    }

    weighted = (
        components["price_vs_median"] * profile.weights.price_vs_median
        + components["momentum"] * profile.weights.momentum
        + components["volatility"] * profile.weights.volatility
        + components["liquidity"] * profile.weights.liquidity
        + components["seller_reliability"] * profile.weights.seller_reliability
        + components["condition_accessories"] * profile.weights.condition_accessories
    )

    buy_score = round(weighted * 100)

    return BuyScoreResult(
        buy_score=buy_score,
        explanations=[price_exp, momentum_exp, vol_exp, liq_exp, seller_exp, cond_exp],
        component_scores=components,
        profile=profile,
    )
