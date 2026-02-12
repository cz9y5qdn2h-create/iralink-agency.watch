from __future__ import annotations

from datetime import datetime

from airflow import DAG
from airflow.operators.python import PythonOperator

from watch_pipeline.collectors import APIMarketCollector, LegalScrapingCollector
from watch_pipeline.pipeline import OpportunityPipeline


pipeline = OpportunityPipeline.default(queue_provider="kafka")


def collect_from_api() -> None:
    pipeline.collect(APIMarketCollector())


def collect_from_scraper() -> None:
    pipeline.collect(LegalScrapingCollector())


def process_queue() -> None:
    while pipeline.process_once():
        pass


with DAG(
    dag_id="watch_opportunity_pipeline",
    start_date=datetime(2024, 1, 1),
    schedule="*/5 * * * *",
    catchup=False,
) as dag:
    api_task = PythonOperator(task_id="collect_api", python_callable=collect_from_api)
    scraping_task = PythonOperator(task_id="collect_scraping", python_callable=collect_from_scraper)
    process_task = PythonOperator(task_id="normalize_dedup_enrich_score_store", python_callable=process_queue)

    [api_task, scraping_task] >> process_task
