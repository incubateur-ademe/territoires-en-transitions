from pathlib import Path
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
    return ReplayRealtime(bus)


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
                    "created_at": "2021-10-28T16:47:28.114708Z",
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


def test_failure_published_when_realtime_event_has_unknown_referentiel(
    bus: InMemoryDomainMessageBus, realtime: ReplayRealtime
):
    prepare_config_and_bus(bus, realtime)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "referentiel_id": "toto",
                    "created_at": "2021-10-28T16:47:28.114708Z",
                    "epci_id": "1",
                },
                "table": "epci_action_statut_update",
            }
        ]
    )
    failure_events = spy_on_event(bus, events.ReferentielScoresForEpciComputationFailed)

    realtime.start()

    assert len(failure_events) == 1

    assert (
        failure_events[0].reason
        == "Referentiel tree could not be compputed for refentiel toto"
    )


def test_realtime_event_has_wrong_record_format(
    bus: InMemoryDomainMessageBus, realtime: ReplayRealtime
):
    prepare_config_and_bus(bus, realtime)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "referentiel_id": "toto",
                    "created_at": "2021-10-28T16:47:28.114708Z",
                    # "epci_id": "1",
                },
                "table": "epci_action_statut_update",
            }
        ]
    )

    failure_events = spy_on_event(bus, events.RealtimeEventWithWrongFormatObserved)

    realtime.start()

    assert len(failure_events) == 1

    assert (
        failure_events[0].reason
        == "Realtime event with wrong format: 'epci_id' missing in record of table epci_action_statut_update.\nObserved: {'record': {'referentiel_id': 'toto', 'created_at': '2021-10-28T16:47:28.114708Z'}, 'table': 'epci_action_statut_update'}"
    )
