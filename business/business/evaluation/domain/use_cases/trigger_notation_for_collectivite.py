from business.evaluation.domain.models import events
from business.utils.domain_message_bus import AbstractDomainMessageBus
from business.utils.use_case import UseCase


class TriggerNotationForCollectivite(UseCase):
    def __init__(self, bus: AbstractDomainMessageBus) -> None:
        self.bus = bus

    def execute(self, trigger: events.TriggerNotationForCollectivite) -> None:
        self.bus.publish_event(
            events.TriggerNotationForCollectiviteForReferentiel(
                trigger.collectivite_id, "eci"
            )
        )
        self.bus.publish_event(
            events.TriggerNotationForCollectiviteForReferentiel(
                trigger.collectivite_id, "cae"
            )
        )
