from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Generic, TypeVar

T = TypeVar("T")


@dataclass(slots=True)
class InMemoryQueue(Generic[T]):
    name: str
    provider: str  # kafka|redpanda|sqs
    _messages: Deque[T] = field(default_factory=deque)

    def publish(self, message: T) -> None:
        self._messages.append(message)

    def consume(self) -> T | None:
        if not self._messages:
            return None
        return self._messages.popleft()


@dataclass(slots=True)
class DeadLetterQueue(Generic[T]):
    name: str = "watch-listing-dlq"
    failed_messages: list[tuple[T, str]] = field(default_factory=list)

    def put(self, payload: T, error: Exception) -> None:
        self.failed_messages.append((payload, str(error)))
