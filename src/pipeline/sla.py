from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class PipelineSLA:
    total_source_records: int = 0
    source_failures: int = 0
    processed_records: int = 0
    ingested_latency_seconds_sum: float = 0.0
    freshness_seconds_sum: float = 0.0

    def record_source_success(self, count: int) -> None:
        self.total_source_records += count

    def record_source_failure(self) -> None:
        self.source_failures += 1

    def record_processed(self, ingested_at: datetime) -> None:
        now = datetime.now(timezone.utc)
        self.processed_records += 1
        self.ingested_latency_seconds_sum += max(0.0, (now - ingested_at).total_seconds())
        self.freshness_seconds_sum += max(0.0, (now - ingested_at).total_seconds())

    @property
    def source_failure_rate(self) -> float:
        if self.total_source_records == 0:
            return 0.0
        return self.source_failures / self.total_source_records

    @property
    def avg_ingestion_latency_seconds(self) -> float:
        if self.processed_records == 0:
            return 0.0
        return self.ingested_latency_seconds_sum / self.processed_records

    @property
    def avg_data_freshness_seconds(self) -> float:
        if self.processed_records == 0:
            return 0.0
        return self.freshness_seconds_sum / self.processed_records
