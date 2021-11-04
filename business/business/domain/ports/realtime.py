import abc
from typing import Literal

import marshmallow_dataclass
from marshmallow import ValidationError
import rx.operators as op
from rx.subject.subject import Subject

from business.domain.models import events
from business.domain.ports.domain_message_bus import AbstractDomainMessageBus

RealtimeTopic = Literal["epci_action_statut_update"]

epci_action_statut_update: RealtimeTopic = "epci_action_statut_update"


class AbstractRealtime(abc.ABC):  # Possible name ? DataLayerObserver ?
    """The Real time part of the data layer
    Convert events from raw_source to typed events and push them into event_source"""

    tables_to_observe = ["epci_action_statut_update"]

    def __init__(self, domain_message_bus: AbstractDomainMessageBus):
        self.external_observable = Subject()
        self.domain_message_bus = domain_message_bus
        self.external_observable.pipe(op.filter(self.table_filter)).subscribe(
            self.publish_to_domain
        )

    @abc.abstractmethod
    def start(self):
        raise NotImplementedError

    def publish_to_domain(self, realtime_observable: dict):
        observable_table = realtime_observable["table"]
        if (
            observable_table
            == "epci_action_statut_update"  # if we were in Python 10, we could use switch :)
        ):  # todo import epci_action_statut_update
            record = realtime_observable["record"]
            try:
                schema = marshmallow_dataclass.class_schema(
                    events.ActionStatusUpdatedForEpci
                )()
                self.domain_message_bus.publish_event(schema.load(record))
            except ValidationError as marshmallow_validation_error:
                self.domain_message_bus.publish_event(
                    events.RealtimeEventWithWrongFormatObserved(
                        f"Realtime event with wrong format: {marshmallow_validation_error}"
                    )
                )
        else:
            raise NotImplementedError

    def table_filter(self, realtime_observable: dict):
        return (
            realtime_observable.get("table") in self.tables_to_observe
            and "record" in realtime_observable
        )
