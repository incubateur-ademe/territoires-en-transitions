from business.domain.ports.domain_message_bus import AbstractDomainMessageBus
from business.domain.models import commands, data_layer_events, events
from .use_case import UseCase


class TransferDataLayerEventToDomain(UseCase):
    def __init__(
        self,
        domain_message_bus: AbstractDomainMessageBus,
    ) -> None:
        self.domain_message_bus = domain_message_bus

    def execute(self, command: commands.TransferDataLayerEventToDomain):
        data_layer_event = command.event
        if isinstance(
            data_layer_event, data_layer_events.UserUpdatedActionStatusForEpci
        ):
            self.domain_message_bus.publish_event(
                events.ActionStatusUpdatedForEpci(
                    epci_id=data_layer_event.epci_id,
                    referentiel_id=data_layer_event.referentiel_id,
                )
            )
