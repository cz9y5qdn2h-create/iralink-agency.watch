from __future__ import annotations

import difflib
from dataclasses import dataclass, field

from .models import NormalizedListing


@dataclass(slots=True)
class ListingDeduplicator:
    similarity_threshold: float = 0.92
    seen_external_ids: set[str] = field(default_factory=set)
    seen_keys: list[str] = field(default_factory=list)

    def is_duplicate(self, listing: NormalizedListing) -> bool:
        if listing.external_id in self.seen_external_ids:
            return True

        key = listing.dedup_key
        best = max((difflib.SequenceMatcher(a=key, b=known).ratio() for known in self.seen_keys), default=0.0)
        if best >= self.similarity_threshold:
            return True

        self.seen_external_ids.add(listing.external_id)
        self.seen_keys.append(key)
        return False
