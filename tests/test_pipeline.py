from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
import unittest

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from pipeline.models import RawWatchListing
from pipeline.runner import PipelineRunner
from pipeline.sinks import InMemoryDatabase, InMemoryRedisCache
from pipeline.stages.collect import StaticConnector
from pipeline.stages.deduplicate import Deduplicator
from pipeline.stages.enrich import Enricher
from pipeline.stages.normalize import NormalizationRules, Normalizer
from pipeline.stages.score import OpportunityScorer


class PipelineTestCase(unittest.TestCase):
    def test_end_to_end_pipeline_with_dedup(self) -> None:
        now = datetime.now(timezone.utc)
        c1 = StaticConnector(
            "source_api",
            records=[
                RawWatchListing(
                    source="source_api",
                    external_id="abc123",
                    brand="Rolex",
                    model="Submariner",
                    condition="Mint",
                    price=10000,
                    currency="USD",
                    url="https://example.com/a",
                    scraped_at=now,
                ),
                RawWatchListing(
                    source="source_api",
                    external_id="abc123",
                    brand="Rolex",
                    model="Submariner",
                    condition="Mint",
                    price=10020,
                    currency="USD",
                    url="https://example.com/b",
                    scraped_at=now,
                ),
            ],
        )

        rules = NormalizationRules(
            fx_rates_to_eur={"USD": 0.9, "EUR": 1.0},
            model_aliases={"rolex submariner": "rolex_submariner"},
            condition_aliases={"mint": "excellent"},
        )

        runner = PipelineRunner(
            connectors=[c1],
            normalizer=Normalizer(rules),
            deduplicator=Deduplicator(),
            enricher=Enricher(
                history_prices={"rolex_submariner": [10000, 12000, 11000]},
                liquidity={"rolex_submariner": 0.9},
                volatility={"rolex_submariner": 0.4},
            ),
            scorer=OpportunityScorer(),
            database=InMemoryDatabase(),
            redis_cache=InMemoryRedisCache(),
        )

        runner.run()

        self.assertEqual(len(runner.database.rows), 1)
        saved = runner.database.rows[0]
        self.assertEqual(saved.normalized_model, "rolex_submariner")
        self.assertGreater(saved.opportunity_score, 0)
        self.assertEqual(len(runner.dlq), 0)

    def test_unsupported_currency_goes_to_dlq(self) -> None:
        c1 = StaticConnector(
            "source_scraper",
            records=[
                RawWatchListing(
                    source="source_scraper",
                    external_id="x1",
                    brand="Omega",
                    model="Speedmaster",
                    condition="Used",
                    price=5000,
                    currency="JPY",
                    url="https://example.com/x1",
                )
            ],
        )

        runner = PipelineRunner(
            connectors=[c1],
            normalizer=Normalizer(
                NormalizationRules(
                    fx_rates_to_eur={"USD": 0.9, "EUR": 1.0},
                    model_aliases={},
                    condition_aliases={"used": "good"},
                )
            ),
            deduplicator=Deduplicator(),
            enricher=Enricher(history_prices={}, liquidity={}, volatility={}),
            scorer=OpportunityScorer(),
            database=InMemoryDatabase(),
            redis_cache=InMemoryRedisCache(),
        )

        runner.run()

        self.assertEqual(len(runner.database.rows), 0)
        self.assertEqual(len(runner.dlq), 1)


if __name__ == "__main__":
    unittest.main()
