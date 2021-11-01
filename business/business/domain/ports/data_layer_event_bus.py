import abc
from typing import Any, Callable, Dict, List, Type

from business.domain.models import data_layer_events
from business.domain.models.data_layer_events import DataLayerEvent


class AbstractDataLayerEventBus(abc.ABC):
    @abc.abstractclassmethod
    def subscribe(
        self, event: DataLayerEvent, callback: Callable[[DataLayerEvent], Any]
    ):
        raise NotImplementedError


class InMemoryDataLayerEventBus(AbstractDataLayerEventBus):
    def __init__(self) -> None:
        self.event_handlers: Dict[
            Type[data_layer_events.DataLayerEvent],
            List[Callable[[DataLayerEvent], Any]],
        ] = {}

    def subscribe(
        self,
        event_type: Type[DataLayerEvent],
        callback: Callable[[DataLayerEvent], Any],
    ):
        if event_type in self.event_handlers:
            self.event_handlers[event_type].append(callback)
        else:
            self.event_handlers[event_type] = [callback]

    # For test purposes only
    def publish(self, event: DataLayerEvent):
        handlers = self.event_handlers.get(type(event))
        if handlers:
            for callback in handlers:
                callback(event)
