from datetime import datetime, timedelta

from watch_pipeline.collectors import APIMarketCollector
from watch_pipeline.pipeline import OpportunityPipeline


def test_pipeline_end_to_end_writes_storage_and_cache():
    pipeline = OpportunityPipeline.default()
    pipeline.collect(APIMarketCollector())

    while pipeline.process_once():
        pass

    assert len(pipeline.writer.repository.records) == 1
    assert pipeline.writer.cache.store
    assert pipeline.dlq.failed_messages == []


def test_sla_failure_rate_and_freshness():
    pipeline = OpportunityPipeline.default()
    pipeline.sla.record_failure("api")
    pipeline.sla.record_success("api", 23.0, datetime.utcnow() - timedelta(seconds=5))

    rate = pipeline.sla.failure_rate("api")
    freshness = pipeline.sla.data_freshness_seconds("api", datetime.utcnow())

    assert 0 < rate < 1
    assert freshness >= 0
