"""
Layer 4 (Zero-RabbitMQ Event Stream Broadcaster):
Maintains a bounded ring-buffer of `RekaSainsEventEnvelope` events for SSE streaming
(`/ai/v1/events/stream`) and structured telemetry logging without any AMQP broker dependency.
"""

from __future__ import annotations

from collections import deque
from threading import Lock
from typing import Deque, List

from app.domain.models import RekaSainsEventEnvelope
from app.infrastructure.config import log_agent_event


class InMemorySSEEventBroadcaster:
    """Thread-safe bounded event ring buffer for SSE streaming & audit inspection."""

    def __init__(self, max_events: int = 200) -> None:
        self._buffer: Deque[RekaSainsEventEnvelope] = deque(maxlen=max_events)
        self._lock = Lock()

    def publish_event(self, event: RekaSainsEventEnvelope) -> None:
        with self._lock:
            self._buffer.append(event)
        log_agent_event(
            event.event_type,
            event_id=event.event_id,
            version=event.version,
        )

    def get_recent_events(self) -> List[RekaSainsEventEnvelope]:
        with self._lock:
            return list(self._buffer)
