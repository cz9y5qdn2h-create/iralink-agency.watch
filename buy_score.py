from __future__ import annotations

from dataclasses import dataclass
from statistics import mean
from typing import Iterable, List, Optional, Sequence, Tuple


@dataclass(frozen=True)
class UserProfileThresholds:
    """Thresholds and weights used by the scoring model."""

    # Weights (must sum to 1.0)
    weight_price_gap: float = 0.35
    weight_momentum: float = 0.20
    weight_volatility: float = 0.15
    weight_liquidity: float = 0.10
    weight_seller_reliability: float = 0.12
    weight_condition_accessories: float = 0.08

    # Feature thresholds
    price_gap_best: float = 0.20
    price_gap_worst: float = -0.20

    momentum_best: float = 0.10
    momentum_worst: float = -0.10

    volatility_low: float = 0.03
    volatility_high: float = 0.15

    liquidity_low: int = 10
    liquidity_high: int = 80


PROFILES = {
    "prudent": UserProfileThresholds(
        weight_price_gap=0.40,
        weight_momentum=0.12,
        weight_volatility=0.20,
        weight_liquidity=0.08,
        weight_seller_reliability=0.12,
        weight_condition_accessories=0.08,
        price_gap_best=0.25,
        price_gap_worst=-0.15,
        momentum_best=0.08,
        momentum_worst=-0.08,
        volatility_low=0.02,
        volatility_high=0.10,
        liquidity_low=15,
        liquidity_high=100,
    ),
    "equilibre": UserProfileThresholds(),
    "agressif": UserProfileThresholds(
        weight_price_gap=0.30,
        weight_momentum=0.26,
        weight_volatility=0.08,
        weight_liquidity=0.12,
        weight_seller_reliability=0.14,
        weight_condition_accessories=0.10,
        price_gap_best=0.15,
        price_gap_worst=-0.25,
        momentum_best=0.14,
        momentum_worst=-0.14,
        volatility_low=0.05,
        volatility_high=0.20,
        liquidity_low=8,
        liquidity_high=60,
    ),
}


@dataclass(frozen=True)
class BuyScoreInput:
    current_price: float
    median_30d: float
    median_90d: float
    recent_prices: Sequence[float]
    listings_volume: int
    seller_reliability: float  # expected in [0,1]
    condition_score: float  # expected in [0,1]
    has_box: bool = False
    has_papers: bool = False


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def _scale_linear(value: float, low: float, high: float, invert: bool = False) -> float:
    if high == low:
        return 0.5
    x = _clamp((value - low) / (high - low))
    return 1 - x if invert else x


def _compute_momentum(prices: Sequence[float]) -> float:
    if len(prices) < 3:
        return 0.0
    split = max(1, len(prices) // 2)
    first_half = prices[:split]
    second_half = prices[split:]
    first_avg = mean(first_half)
    second_avg = mean(second_half) if second_half else first_avg
    if first_avg == 0:
        return 0.0
    return (second_avg - first_avg) / first_avg


def _compute_volatility(prices: Sequence[float]) -> float:
    if len(prices) < 3:
        return 0.0
    rets: List[float] = []
    for prev, curr in zip(prices, prices[1:]):
        if prev > 0:
            rets.append((curr - prev) / prev)
    if not rets:
        return 0.0
    m = mean(rets)
    variance = sum((r - m) ** 2 for r in rets) / len(rets)
    return variance ** 0.5


def _condition_accessories_score(condition_score: float, has_box: bool, has_papers: bool) -> float:
    base = _clamp(condition_score)
    bonus = 0.0
    if has_box:
        bonus += 0.08
    if has_papers:
        bonus += 0.10
    return _clamp(base + bonus)


def compute_buy_score(
    data: BuyScoreInput,
    profile: str = "equilibre",
    thresholds_override: Optional[UserProfileThresholds] = None,
) -> Tuple[int, List[str]]:
    """Return a buy score (0-100) and a list of human-readable reasons."""
    cfg = thresholds_override or PROFILES.get(profile, PROFILES["equilibre"])

    gap_30 = (data.median_30d - data.current_price) / data.median_30d if data.median_30d else 0.0
    gap_90 = (data.median_90d - data.current_price) / data.median_90d if data.median_90d else 0.0
    best_gap = max(gap_30, gap_90)
    price_component = _scale_linear(best_gap, cfg.price_gap_worst, cfg.price_gap_best)

    momentum = _compute_momentum(data.recent_prices)
    momentum_component = _scale_linear(momentum, cfg.momentum_worst, cfg.momentum_best, invert=True)

    volatility = _compute_volatility(data.recent_prices)
    volatility_component = _scale_linear(volatility, cfg.volatility_low, cfg.volatility_high, invert=True)

    liquidity_component = _scale_linear(data.listings_volume, cfg.liquidity_low, cfg.liquidity_high)

    seller_component = _clamp(data.seller_reliability)

    condition_component = _condition_accessories_score(
        condition_score=data.condition_score,
        has_box=data.has_box,
        has_papers=data.has_papers,
    )

    weighted = (
        price_component * cfg.weight_price_gap
        + momentum_component * cfg.weight_momentum
        + volatility_component * cfg.weight_volatility
        + liquidity_component * cfg.weight_liquidity
        + seller_component * cfg.weight_seller_reliability
        + condition_component * cfg.weight_condition_accessories
    )

    final_score = round(_clamp(weighted) * 100)

    reasons: List[str] = []
    if gap_90 >= 0:
        reasons.append(f"Sous le médian 90j de {gap_90 * 100:.0f}%")
    else:
        reasons.append(f"Au-dessus du médian 90j de {abs(gap_90) * 100:.0f}%")

    if volatility <= cfg.volatility_low:
        reasons.append("Volatilité faible")
    elif volatility >= cfg.volatility_high:
        reasons.append("Volatilité élevée")
    else:
        reasons.append("Volatilité modérée")

    reasons.append(f"Vendeur fiable score {seller_component:.2f}")

    if momentum < 0:
        reasons.append("Momentum baissier court terme")
    elif momentum > 0:
        reasons.append("Momentum haussier court terme")
    else:
        reasons.append("Momentum neutre")

    acc = []
    if data.has_box:
        acc.append("boîte")
    if data.has_papers:
        acc.append("papiers")
    if acc:
        reasons.append(f"Accessoires inclus: {', '.join(acc)}")

    return final_score, reasons
