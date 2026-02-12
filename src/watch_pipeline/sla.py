from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class SourceStats:
    ingested: int = 0
    failed: int = 0
    last_ingestion_at: datetime | None = None
    ingestion_latency_ms: list[float] = field(default_factory=list)


@dataclass(slots=True)
class SlaTracker:
    by_source: dict[str, SourceStats] = field(default_factory=dict)

    def record_success(self, source: str, latency_ms: float, event_time: datetime) -> None:
        stats = self.by_source.setdefault(source, SourceStats())
        stats.ingested += 1
        stats.ingestion_latency_ms.append(latency_ms)
        stats.last_ingestion_at = event_time

    def record_failure(self, source: str) -> None:
        stats = self.by_source.setdefault(source, SourceStats())
        stats.failed += 1

    def failure_rate(self, source: str) -> float:
        stats = self.by_source.get(source, SourceStats())
        total = stats.ingested + stats.failed
        return 0.0 if total == 0 else stats.failed / total

    def data_freshness_seconds(self, source: str, now: datetime) -> float:
        stats = self.by_source.get(source)
        if not stats or not stats.last_ingestion_at:
            return float("inf")
        return (now - stats.last_ingestion_at).total_seconds()
