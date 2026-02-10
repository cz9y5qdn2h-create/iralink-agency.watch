def compute_opportunity_score(market_price: float, asking_price: float) -> float:
    """Score simple basé sur la décote par rapport au prix de marché."""
    if market_price <= 0:
        raise ValueError("market_price must be greater than 0")

    discount_ratio = max(0.0, (market_price - asking_price) / market_price)
    return round(min(1.0, discount_ratio * 2), 2)
