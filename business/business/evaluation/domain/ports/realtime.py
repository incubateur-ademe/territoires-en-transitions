import abc
from typing import List, Literal

import marshmallow_dataclass
from marshmallow import ValidationError
import rx.operators as op
from rx.subject.subject import Subject
from business.evaluation.adapters import supabase_names
from business.evaluation.domain.models.collectivite_activation_event import (
    CollectiviteActivationEvent,
)
from business.evaluation.domain.models.reponse_update_event import ReponseUpdateEvent

from business.utils.domain_message_bus import DomainEvent
from business.evaluation.domain.models.action_statut_update_event import (
    ActionStatutUpdateEvent,
)
from business.utils.domain_message_bus import AbstractDomainMessageBus
from business.evaluation.domain.models import events

RealtimeTopic = Literal["collectivite_action_statut_update"]

collectivite_action_statut_update: RealtimeTopic = "collectivite_action_statut_update"


class AbstractConverter(abc.ABC):
    @abc.abstractmethod
    def filter(self, data: dict) -> bool:
        pass

    @abc.abstractmethod
    def convert(self, data: dict) -> DomainEvent:
        pass


class CollectiviteActionStatutUpdateConverter(AbstractConverter):
    def __init__(self) -> None:
        self.table = supabase_names.events.statut_update
        self.schema = marshmallow_dataclass.class_schema(ActionStatutUpdateEvent)()

    def filter(self, data: dict) -> bool:
        return data.get("table") == self.table

    def convert(self, data: dict) -> DomainEvent:
        try:
            raw_event: ActionStatutUpdateEvent = self.schema.load(
                data.get("record", {})
            )  # type: ignore
            return events.TriggerNotationForCollectiviteForReferentiel(
                collectivite_id=raw_event.collectivite_id,
                referentiel=raw_event.referentiel,
            )
        except ValidationError as marshmallow_validation_error:
            return events.RealtimeEventWithWrongFormatObserved(
                f"Realtime event with wrong format: {marshmallow_validation_error}"
            )


class CollectiviteReponseUpdateConverter(AbstractConverter):
    def __init__(self) -> None:
        self.table = supabase_names.events.reponse_update
        self.schema = marshmallow_dataclass.class_schema(ReponseUpdateEvent)()

    def filter(self, data: dict) -> bool:
        return data.get("table") == self.table

    def convert(self, data: dict) -> DomainEvent:
        try:
            raw_event: ReponseUpdateEvent = self.schema.load(
                data.get("record", {})
            )  # type: ignore
            return events.TriggerPersonnalisationForCollectivite(
                collectivite_id=raw_event.collectivite_id,
            )
        except ValidationError as marshmallow_validation_error:
            return events.RealtimeEventWithWrongFormatObserved(
                f"Realtime event with wrong format: {marshmallow_validation_error}"
            )


class CollectiviteActivationConverter(AbstractConverter):
    def __init__(self) -> None:
        self.table = supabase_names.events.collectivite_activation
        self.schema = marshmallow_dataclass.class_schema(CollectiviteActivationEvent)()

    def filter(self, data: dict) -> bool:
        return data.get("table") == self.table

    def convert(self, data: dict) -> DomainEvent:
        try:
            raw_event: CollectiviteActivationEvent = self.schema.load(
                data.get("record", {})
            )  # type: ignore
            return events.TriggerPersonnalisationForCollectivite(
                collectivite_id=raw_event.collectivite_id,
            )
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
                op.filter(converter.filter),  # type: ignore
                op.map(converter.convert),  # type: ignore
            ).subscribe(self.domain_message_bus.publish_event)

    @abc.abstractmethod
    def start(self):
        raise NotImplementedError
