from services.collector.main import collect_prices
from services.scoring.main import compute_opportunity_score


def test_collect_prices_returns_items() -> None:
    prices = collect_prices()
    assert len(prices) > 0
    assert prices[0].source


def test_compute_opportunity_score() -> None:
    assert compute_opportunity_score(10000, 9000) == 0.2
