from business.evaluation.domain.models import events
from business.core.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.evaluation.domain.ports.action_score_repo import (
    InMemoryActionScoreRepository,
)
from business.evaluation.domain.use_cases.store_scores_for_collectivite import (
    StoreScoresForCollectivite,
)

from tests.utils.spy_on_event import spy_on_event
from tests.utils.score_factory import make_action_score


def test_can_store_scores():
    bus = InMemoryDomainMessageBus()
    score_repo = InMemoryActionScoreRepository()

    use_case = StoreScoresForCollectivite(bus, score_repo)

    scores = [
        make_action_score("eci", point_referentiel=20),
        make_action_score("eci_1", point_referentiel=15),
        make_action_score("eci_2", point_referentiel=5),
    ]
    trigger = events.ReferentielScoresForCollectiviteComputed(
        referentiel="eci", collectivite_id=1, scores=scores
    )

    entity_stored_events = spy_on_event(bus, events.ScoresForCollectiviteStored)
    storage_failed_events = spy_on_event(bus, events.ScoresStorageForCollectiviteFailed)

    use_case.execute(trigger)

    assert len(storage_failed_events) == 0
    assert len(entity_stored_events) == 1
    assert len(score_repo.get_entities_for_collectivite(1)) == 3
