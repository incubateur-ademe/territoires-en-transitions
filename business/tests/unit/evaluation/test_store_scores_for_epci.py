from business.evaluation.domain.models import events
from business.core.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.evaluation.domain.ports.action_score_repo import (
    InMemoryActionScoreRepository,
)
from business.evaluation.domain.use_cases.store_scores_for_epci import (
    StoreScoresForEpci,
)

from tests.utils.spy_on_event import spy_on_event
from tests.utils.score_factory import make_action_score


def test_can_store_scores():
    bus = InMemoryDomainMessageBus()
    score_repo = InMemoryActionScoreRepository()

    use_case = StoreScoresForEpci(bus, score_repo)

    scores = [
        make_action_score("eci", points=20),
        make_action_score("eci_1", points=15),
        make_action_score("eci_2", points=5),
    ]
    trigger = events.ReferentielScoresForEpciComputed(
        referentiel="eci", epci_id=1, scores=scores
    )

    entity_stored_events = spy_on_event(bus, events.ScoresForEpciStored)
    storage_failed_events = spy_on_event(bus, events.ScoresStorageForEpciFailed)

    use_case.execute(trigger)

    assert len(storage_failed_events) == 0
    assert len(entity_stored_events) == 1
    assert len(score_repo.get_entities_for_epci(1)) == 3
