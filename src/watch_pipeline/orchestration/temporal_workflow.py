from __future__ import annotations

from temporalio import activity, workflow

from watch_pipeline.collectors import APIMarketCollector, LegalScrapingCollector
from watch_pipeline.pipeline import OpportunityPipeline


pipeline = OpportunityPipeline.default(queue_provider="sqs")


@activity.defn
async def collect_api_activity() -> int:
    return pipeline.collect(APIMarketCollector())


@activity.defn
async def collect_scraping_activity() -> int:
    return pipeline.collect(LegalScrapingCollector())


@activity.defn
async def process_activity() -> int:
    processed = 0
    while pipeline.process_once():
        processed += 1
    return processed


@workflow.defn
class WatchOpportunityWorkflow:
    @workflow.run
    async def run(self) -> dict[str, int]:
        api_count = await workflow.execute_activity(collect_api_activity, start_to_close_timeout=60)
        scraping_count = await workflow.execute_activity(collect_scraping_activity, start_to_close_timeout=60)
        processed = await workflow.execute_activity(process_activity, start_to_close_timeout=60)

        return {
            "api_collected": api_count,
            "scraping_collected": scraping_count,
            "processed": processed,
            "dlq_size": len(pipeline.dlq.failed_messages),
        }
