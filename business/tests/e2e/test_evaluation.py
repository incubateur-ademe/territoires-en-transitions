from pathlib import Path
from typing import List
from business.domain.ports.realtime import (
    AbstractConverter,
    EpciActionStatutUpdateConverter,
)
import pytest

from business.domain.ports.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.domain.ports.action_score_repo import (
    InMemoryActionScoreRepository,
)
from business.domain.ports.action_status_repo import (
    InMemoryActionStatusRepository,
)
from business.adapters.replay_realtime import ReplayRealtime
from business.adapters.json_referentiel_repo import JsonReferentielRepository
from business.domain.models import events
from business.entrypoints.prepare_bus import prepare_bus
from business.entrypoints.realtime_evaluation import (
    EvaluationConfig,
    EVENT_HANDLERS,
    COMMAND_HANDLERS,
)
from tests.utils.spy_on_event import spy_on_event


@pytest.fixture
def bus() -> InMemoryDomainMessageBus:
    return InMemoryDomainMessageBus()


@pytest.fixture
def realtime(bus) -> ReplayRealtime:
    converters: List[AbstractConverter] = [EpciActionStatutUpdateConverter()]
    return ReplayRealtime(bus, converters=converters)


def prepare_config_and_bus(bus: InMemoryDomainMessageBus, realtime: ReplayRealtime):
    config = EvaluationConfig(  # TODO : this should not be InMemory in E2E tests !
        referentiel_repo=JsonReferentielRepository(
            Path("./data/referentiel_repository.json")
        ),  # Variabilize path !
        score_repo=InMemoryActionScoreRepository(),
        statuses_repo=InMemoryActionStatusRepository(),
        domain_message_bus=bus,
        realtime=realtime,
    )
    prepare_bus(config, EVENT_HANDLERS, COMMAND_HANDLERS)


def test_action_status_updated_on_realtime_event_with_correct_format(
    bus: InMemoryDomainMessageBus, realtime: ReplayRealtime
):
    prepare_config_and_bus(bus, realtime)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "referentiel_id": "eci",
                    "epci_id": "1",
                },
                "table": "epci_action_statut_update",
            }
        ]
    )

    score_computed_events = spy_on_event(bus, events.ReferentielScoresForEpciComputed)
    score_stored_events = spy_on_event(bus, events.ScoresForEpciStored)

    realtime.start()

    assert len(score_computed_events) == 1
    assert len(score_stored_events) == 1

    assert score_computed_events[0].epci_id == score_computed_events[0].epci_id == "1"
    assert (
        score_computed_events[0].referentiel_id
        == score_computed_events[0].referentiel_id
        == "eci"
    )
