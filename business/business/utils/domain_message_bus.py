import abc
from dataclasses import dataclass
from collections import defaultdict
from typing import Any, Callable, Dict, List, Optional, Type


@dataclass
class DomainEvent:
    pass


@dataclass
class DomainFailureEvent(DomainEvent):
    reason: str


EventCallback = Callable[[DomainEvent], Any]


class AbstractDomainMessageBus(abc.ABC):
    @abc.abstractclassmethod
    def subscribe_to_event(
        self,
        event_type: Type[DomainEvent],
        callback: EventCallback,
    ) -> None:
        raise NotImplementedError()

    @abc.abstractmethod
    def publish_event(self, event: DomainEvent) -> None:
        raise NotImplementedError()


class InMemoryDomainMessageBus(AbstractDomainMessageBus):
    def __init__(
        self,
        event_handlers: Optional[Dict[Type[DomainEvent], List[EventCallback]]] = None,
    ) -> None:
        self._event_handlers = event_handlers or defaultdict(lambda: [])

    def subscribe_to_event(
        self, event_type: Type[DomainEvent], callback: EventCallback
    ) -> None:
        if event_type in self._event_handlers:
            self._event_handlers[event_type].append(callback)
        else:
            self._event_handlers[event_type] = [callback]

    def publish_event(self, event: DomainEvent) -> None:
        if isinstance(event, DomainFailureEvent):
            print("Domain failure : ", event.reason)
        print("Published event :", type(event))
        handlers = self._event_handlers.get(type(event))
        if handlers:
            print("Handle event ", type(event))
            for callback in handlers:
                callback(event)
