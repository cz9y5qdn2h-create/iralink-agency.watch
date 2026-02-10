from src.buy_score import ListingSignals, UserThresholds, compute_buy_score


def test_buy_score_and_explanations_equilibre():
    signals = ListingSignals(
        current_price=8800,
        median_30d=9400,
        median_90d=10000,
        momentum_14d_pct=3.2,
        volatility_30d_pct=5.2,
        listing_volume_30d=31,
        seller_reliability=0.92,
        condition_score=0.84,
        has_box=True,
        has_papers=True,
    )

    result = compute_buy_score(signals, profile_name="equilibre")

    assert 0 <= result.buy_score <= 100
    assert any("Sous le médian 90j" in line for line in result.explanations)
    assert any("Volatilité faible" in line for line in result.explanations)
    assert any("Vendeur fiable score 0.92" in line for line in result.explanations)


def test_profile_changes_score():
    signals = ListingSignals(
        current_price=9800,
        median_30d=9700,
        median_90d=9600,
        momentum_14d_pct=4.0,
        volatility_30d_pct=15.0,
        listing_volume_30d=7,
        seller_reliability=0.75,
        condition_score=0.70,
        has_box=False,
        has_papers=False,
    )

    prudent = compute_buy_score(signals, profile_name="prudent")
    aggressive = compute_buy_score(signals, profile_name="agressif")

    assert prudent.buy_score != aggressive.buy_score


def test_threshold_override_is_applied():
    signals = ListingSignals(
        current_price=9500,
        median_30d=10000,
        median_90d=10000,
        momentum_14d_pct=0.0,
        volatility_30d_pct=10.0,
        listing_volume_30d=12,
        seller_reliability=0.60,
        condition_score=0.60,
        has_box=True,
        has_papers=False,
    )

    override = UserThresholds(
        under_median_cap_pct=30,
        over_median_cap_pct=10,
        momentum_neutral_pct=-2,
        volatility_low_pct=5,
        volatility_high_pct=11,
        low_liquidity_volume=4,
        high_liquidity_volume=40,
        accessories_bonus=0.2,
    )

    base = compute_buy_score(signals, profile_name="equilibre")
    tuned = compute_buy_score(signals, profile_name="equilibre", override_thresholds=override)

    assert base.buy_score != tuned.buy_score
