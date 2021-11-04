import abc
from typing import Literal


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
        # self._domain_observable = Subject()
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
                self.domain_message_bus.publish_event(
                    events.ActionStatusUpdatedForEpci(  # todo : schema validation here !
                        epci_id=record["epci_id"],
                        referentiel_id=record["referentiel_id"],
                    )
                )
            except KeyError as missing_key:
                self.domain_message_bus.publish_event(
                    events.RealtimeEventWithWrongFormatObserved(
                        f"Realtime event with wrong format: {missing_key} missing in record of table {observable_table}.\nObserved: {realtime_observable}"
                    )
                )
        else:
            raise NotImplementedError

    def table_filter(self, realtime_observable: dict):
        return (
            realtime_observable.get("table") in self.tables_to_observe
            and "record" in realtime_observable
        )
