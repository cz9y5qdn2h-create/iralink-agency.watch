from __future__ import annotations

from difflib import SequenceMatcher

from pipeline.models import NormalizedWatchListing


class Deduplicator:
    def __init__(self, fuzzy_threshold: float = 0.92) -> None:
        self.fuzzy_threshold = fuzzy_threshold
        self._seen_external_ids: set[str] = set()
        self._seen_signatures: list[str] = []

    def is_duplicate(self, item: NormalizedWatchListing) -> bool:
        if item.external_id in self._seen_external_ids:
            return True

        signature = self._signature(item)
        for seen in self._seen_signatures:
            if SequenceMatcher(None, signature, seen).ratio() >= self.fuzzy_threshold:
                return True

        self._seen_external_ids.add(item.external_id)
        self._seen_signatures.append(signature)
        return False

    @staticmethod
    def _signature(item: NormalizedWatchListing) -> str:
        rounded_bucket = int(item.price_eur // 100)
        return f"{item.normalized_model}|{item.normalized_condition}|{rounded_bucket}"
