from business.evaluation.domain.models import events
from business.utils.domain_message_bus import (
    AbstractDomainMessageBus,
)
from business.evaluation.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
)
from business.utils.timeit import timeit
from business.utils.use_case import UseCase


class StoreScoresForCollectivite(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        score_repo: AbstractActionScoreRepository,
    ) -> None:
        self.bus = bus
        self.score_repo = score_repo

    @timeit("StoreScoresForCollectivite.execute")
    def execute(self, trigger: events.ReferentielScoresForCollectiviteComputed):
        collectivite_id = trigger.collectivite_id
        scores = trigger.scores
        try:
            self.score_repo.add_entities_for_collectivite(
                collectivite_id, entities=scores
            )
            self.bus.publish_event(
                events.ScoresForCollectiviteStored(collectivite_id=collectivite_id)
            )
        except Exception as storing_error:  # TODO : catch more precise exception
            self.bus.publish_event(
                events.ScoresStorageForCollectiviteFailed(reason=str(storing_error))
            )
