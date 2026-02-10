from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Deque, Generic, Iterable, Optional, TypeVar


T = TypeVar("T")


@dataclass
class QueueMessage(Generic[T]):
    payload: T


class InMemoryQueue(Generic[T]):
    """Abstraction de queue compatible avec l'idée Kafka/Redpanda/SQS."""

    def __init__(self) -> None:
        self._q: Deque[QueueMessage[T]] = deque()

    def publish(self, payload: T) -> None:
        self._q.append(QueueMessage(payload=payload))

    def extend(self, payloads: Iterable[T]) -> None:
        for payload in payloads:
            self.publish(payload)

    def consume(self) -> Optional[QueueMessage[T]]:
        if not self._q:
            return None
        return self._q.popleft()

    def __len__(self) -> int:
        return len(self._q)


class DeadLetterQueue(InMemoryQueue[T]):
    pass
