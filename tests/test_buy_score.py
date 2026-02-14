import unittest

from buy_score import ListingInput, RiskProfile, UserThresholds, compute_buy_score


class BuyScoreTests(unittest.TestCase):
    def test_score_and_explanations_balanced(self):
        payload = ListingInput(
            listing_price=8800,
            median_30d_price=9600,
            median_90d_price=10000,
            short_term_momentum=0.03,
            volatility=0.05,
            listing_volume=24,
            seller_reliability_score=0.92,
            condition_score=0.86,
            has_box=True,
            has_papers=True,
        )

        result = compute_buy_score(payload, profile=RiskProfile.EQUILIBRE)

        self.assertGreaterEqual(result.buy_score, 70)
        self.assertIn("Sous le médian 90j de 12%", result.explanations)
        self.assertIn("Volatilité faible", result.explanations)
        self.assertIn("Vendeur fiable score 0.92", result.explanations)

    def test_prudent_profile_penalizes_low_reliability(self):
        payload = ListingInput(
            listing_price=9800,
            median_30d_price=10000,
            median_90d_price=10200,
            short_term_momentum=0.0,
            volatility=0.06,
            listing_volume=18,
            seller_reliability_score=0.78,
            condition_score=0.80,
            has_box=False,
            has_papers=False,
        )

        prudent_result = compute_buy_score(payload, profile=RiskProfile.PRUDENT)
        agressive_result = compute_buy_score(payload, profile=RiskProfile.AGRESSIF)

        self.assertLess(prudent_result.buy_score, agressive_result.buy_score)

    def test_custom_thresholds_are_applied(self):
        payload = ListingInput(
            listing_price=9700,
            median_30d_price=9800,
            median_90d_price=9850,
            short_term_momentum=-0.01,
            volatility=0.08,
            listing_volume=10,
            seller_reliability_score=0.84,
            condition_score=0.78,
            has_box=True,
            has_papers=False,
        )
        strict = UserThresholds(
            median_discount_min=0.08,
            momentum_min=0.02,
            volatility_max=0.05,
            liquidity_min=25,
            seller_reliability_min=0.9,
            condition_bonus_accessories=0.5,
        )

        result = compute_buy_score(payload, overrides=strict)

        self.assertLess(result.buy_score, 60)


if __name__ == "__main__":
    unittest.main()
