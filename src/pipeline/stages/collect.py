from __future__ import annotations

from typing import Iterable

from pipeline.models import RawWatchListing


class SourceConnector:
    """Connecteur API/scraping légal."""

    def __init__(self, source_name: str) -> None:
        self.source_name = source_name

    def fetch(self) -> Iterable[RawWatchListing]:
        raise NotImplementedError


class StaticConnector(SourceConnector):
    def __init__(self, source_name: str, records: list[RawWatchListing]) -> None:
        super().__init__(source_name)
        self.records = records

    def fetch(self) -> Iterable[RawWatchListing]:
        return self.records
