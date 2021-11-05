import abc
from typing import List, Literal

import marshmallow_dataclass
from marshmallow import ValidationError
import rx.operators as op
from rx.subject.subject import Subject

from business.domain.models import events
from business.domain.ports.domain_message_bus import AbstractDomainMessageBus

RealtimeTopic = Literal["epci_action_statut_update"]

epci_action_statut_update: RealtimeTopic = "epci_action_statut_update"


class AbstractConverter(abc.ABC):
    @abc.abstractmethod
    def filter(self, data: dict) -> bool:
        pass

    @abc.abstractmethod
    def convert(self, data: dict) -> events.DomainEvent:
        pass


class EpciActionStatutUpdateConverter(AbstractConverter):
    def __init__(self) -> None:
        self.table = "epci_action_statut_update"
        self.schema = marshmallow_dataclass.class_schema(
            events.ActionStatusUpdatedForEpci
        )()

    def filter(self, data: dict) -> bool:
        return data.get("table") == self.table

    def convert(self, data: dict) -> events.DomainEvent:
        try:
            event = self.schema.load(data.get("record", {}))
            return event
        except ValidationError as marshmallow_validation_error:
            return events.RealtimeEventWithWrongFormatObserved(
                f"Realtime event with wrong format: {marshmallow_validation_error}"
            )


class AbstractRealtime(abc.ABC):  # Possible name ? DataLayerObserver ?
    """The Real time part of the data layer
    Convert events from raw_source to typed events and push them into event_source"""

    def __init__(
        self,
        domain_message_bus: AbstractDomainMessageBus,
        converters: List[AbstractConverter],
    ):
        self.external_observable = Subject()
        self.domain_message_bus = domain_message_bus

        for converter in converters:
            self.external_observable.pipe(
                op.filter(converter.filter),
                op.map(converter.convert),
            ).subscribe(self.domain_message_bus.publish_event)

    @abc.abstractmethod
    def start(self):
        raise NotImplementedError
