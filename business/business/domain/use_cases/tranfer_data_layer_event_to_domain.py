from business.domain.ports.domain_message_bus import AbstractDomainMessageBus
from business.domain.models import commands, events
from .use_case import UseCase


class TransferRealtimeEventToDomain(UseCase):
    def __init__(
        self,
        domain_message_bus: AbstractDomainMessageBus,
    ) -> None:
        self.domain_message_bus = domain_message_bus

    def execute(self, command):
        data_layer_event = command.event
        breakpoint()
        if (
            data_layer_event.topic == "epci_action_statut_update"
        ):  # todo import epci_action_statut_update
            record = data_layer_event.record
            self.domain_message_bus.publish_event(
                events.ActionStatusUpdatedForEpci(  # todo : schema validation here !
                    epci_id=record["epci_id"],
                    referentiel_id=record["referentiel_id"],
                )
            )
