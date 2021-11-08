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

from business.adapters.replay_realtime import ReplayRealtime
from business.adapters.json_referentiel_repo import JsonReferentielRepository
from business.domain.models import events
from business.entrypoints.environment_variables import EnvironmentVariables
from business.entrypoints.prepare_bus import prepare_bus
from business.entrypoints.realtime_evaluation import (
    EvaluationConfig,
    EVENT_HANDLERS,
    COMMAND_HANDLERS,
)
from tests.utils.spy_on_event import spy_on_event


@pytest.fixture
def env_variables() -> EnvironmentVariables:
    return EnvironmentVariables(
        referentiels_repository="JSON",
        labelisation_repositories="IN_MEMORY",
        realtime="REPLAY",
        referentiels_repo_json="./data/referentiel_repository.json",  # This implies that CLI has already run and generated referentiels in this file
    )


@pytest.fixture
def bus() -> InMemoryDomainMessageBus:
    return InMemoryDomainMessageBus()


@pytest.fixture
def realtime(bus) -> ReplayRealtime:
    converters: List[AbstractConverter] = [EpciActionStatutUpdateConverter()]
    return ReplayRealtime(bus, converters=converters)


def prepare_config_and_bus(
    bus: InMemoryDomainMessageBus,
    realtime: ReplayRealtime,
    env_variables: EnvironmentVariables,
):
    config = EvaluationConfig(bus, realtime=realtime, env_variables=env_variables)
    prepare_bus(config, EVENT_HANDLERS, COMMAND_HANDLERS)


def test_action_status_updated_on_realtime_event_with_correct_format(
    bus: InMemoryDomainMessageBus,
    realtime: ReplayRealtime,
    env_variables: EnvironmentVariables,
):
    prepare_config_and_bus(bus, realtime, env_variables)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "referentiel": "eci",
                    "epci_id": 1,
                    "created_at": "2020-01-01T12",
                },
                "table": "epci_action_statut_update_event",
            }
        ]
    )

    score_computed_events = spy_on_event(bus, events.ReferentielScoresForEpciComputed)
    score_stored_events = spy_on_event(bus, events.ScoresForEpciStored)

    realtime.start()

    assert len(score_computed_events) == 1
    assert len(score_stored_events) == 1

    assert score_computed_events[0].epci_id == score_computed_events[0].epci_id == 1
    assert (
        score_computed_events[0].referentiel
        == score_computed_events[0].referentiel
        == "eci"
    )
