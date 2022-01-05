from business.evaluation.domain.models.events import ActionStatutUpdatedForCollectivite
from business.evaluation.domain.ports.action_statut_update_event_repo import (
    AbstractActionStatutUpdateEventRepository,
)
from business.utils.use_case import UseCase
from business.core.domain.ports.domain_message_bus import AbstractDomainMessageBus
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
)


class CatchUpUnprocessedActionStatusUpdateEvents(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        action_statut_update_event_repo: AbstractActionStatutUpdateEventRepository,
    ) -> None:
        self.bus = bus
        self.action_statut_update_event_repo = action_statut_update_event_repo

    def execute(self):
        unprocessed_events = (
            self.action_statut_update_event_repo.get_unprocessed_events()
        )
        for event in unprocessed_events:
            self.bus.publish_event(
                ActionStatutUpdatedForCollectivite(
                    collectivite_id=event.collectivite_id,
                    referentiel=event.referentiel,
                )
            )
