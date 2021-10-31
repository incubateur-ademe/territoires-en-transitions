from business.domain.models import commands, events
from business.domain.ports.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.domain.ports.action_score_repo import AbstractActionScoreRepository


class StoreScoresForEpci:
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        score_repo: AbstractActionScoreRepository,
    ) -> None:
        self.bus = bus
        self.score_repo = score_repo

    def execute(self, command: commands.StoreScoresForEpci):
        epci_id = command.epci_id
        scores = command.scores
        try:
            self.score_repo.add_entities_for_epci(epci_id, entities=scores)
            self.bus.publish_event(events.ScoresForEpciStored(epci_id=epci_id))
        except Exception as storing_error:  # TODO : catch more precise exception
            self.bus.publish_event(
                events.ScoresStorageForEpciFailed(reason=str(storing_error))
            )
