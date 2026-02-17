import unittest

from buy_score import BuyScoreInput, PROFILES, compute_buy_score


class BuyScoreTests(unittest.TestCase):
    def test_score_and_reasons_in_french(self):
        data = BuyScoreInput(
            current_price=8800,
            median_30d=9200,
            median_90d=10000,
            recent_prices=[10000, 9900, 9800, 9700, 9600],
            listings_volume=75,
            seller_reliability=0.92,
            condition_score=0.85,
            has_box=True,
            has_papers=True,
        )

        score, reasons = compute_buy_score(data, profile="equilibre")

        self.assertTrue(0 <= score <= 100)
        self.assertTrue(any("Sous le médian 90j" in r for r in reasons))
        self.assertTrue(any("Volatilité" in r for r in reasons))
        self.assertTrue(any("Vendeur fiable score 0.92" in r for r in reasons))

    def test_profiles_change_output(self):
        data = BuyScoreInput(
            current_price=10000,
            median_30d=10000,
            median_90d=10000,
            recent_prices=[10000, 10100, 10300, 10400, 10600],
            listings_volume=20,
            seller_reliability=0.7,
            condition_score=0.7,
            has_box=False,
            has_papers=False,
        )

        prudent_score, _ = compute_buy_score(data, profile="prudent")
        aggressive_score, _ = compute_buy_score(data, profile="agressif")

        self.assertNotEqual(prudent_score, aggressive_score)

    def test_profile_weights_sum_to_one(self):
        for profile in PROFILES.values():
            total = (
                profile.weight_price_gap
                + profile.weight_momentum
                + profile.weight_volatility
                + profile.weight_liquidity
                + profile.weight_seller_reliability
                + profile.weight_condition_accessories
            )
            self.assertAlmostEqual(total, 1.0, places=6)


if __name__ == "__main__":
    unittest.main()
