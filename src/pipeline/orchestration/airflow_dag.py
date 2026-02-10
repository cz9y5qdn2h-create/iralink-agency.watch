from __future__ import annotations

from datetime import datetime

# Airflow import gardé local pour éviter de casser les tests sans dépendance.
from airflow import DAG
from airflow.operators.python import PythonOperator

from pipeline.runner import PipelineRunner


def _run_pipeline_callable(**_: dict) -> None:
    # Le câblage concret (connecteurs, règles, stores) est injecté en prod.
    # Cette fonction existe pour illustrer l'orchestration demandée.
    raise NotImplementedError("Inject pipeline dependencies from your deployment package")


with DAG(
    dag_id="watch_pipeline_dag",
    start_date=datetime(2024, 1, 1),
    schedule="*/5 * * * *",
    catchup=False,
    tags=["watch", "pipeline", "sla"],
) as watch_pipeline_dag:
    run_pipeline = PythonOperator(
        task_id="run_watch_pipeline",
        python_callable=_run_pipeline_callable,
    )

    run_pipeline
