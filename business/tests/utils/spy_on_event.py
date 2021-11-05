from typing import Any, Type, List

from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.domain.models import events


def spy_on_event(
    event_bus: AbstractDomainMessageBus, event_type: Type[events.DomainEvent]
) -> List[Any]:
    published_events = []

    def spy(e):
        published_events.append(e)

    event_bus.subscribe_to_event(event_type, spy)
    return published_events
