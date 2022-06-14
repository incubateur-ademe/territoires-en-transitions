import pytest

from business.utils.domain_message_bus import (
    InMemoryDomainMessageBus,
)

from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.evaluation.domain.models import events
from business.utils.environment_variables import EnvironmentVariables
from tests.e2e.prepare_evaluation import *
from tests.utils.spy_on_event import spy_on_event


@pytest.fixture
def env_variables() -> EnvironmentVariables:
    return EnvironmentVariables(
        referentiels_repository="SUPABASE",
        repositories="SUPABASE",
        realtime="REPLAY",
    )


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
                    "referentiel": "cae",
                    "collectivite_id": 8,
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "action_statut_update_event",
            }
        ]
    )

    score_computed_events = spy_on_event(
        bus, events.ReferentielScoresForCollectiviteComputed
    )
    score_stored_events = spy_on_event(bus, events.ScoresForCollectiviteStored)

    realtime.start()

    assert len(score_computed_events) == 1
    assert len(score_stored_events) == 1

    assert (
        score_computed_events[0].collectivite_id
        == score_computed_events[0].collectivite_id
        == 8
    )
    assert (
        score_computed_events[0].referentiel
        == score_computed_events[0].referentiel
        == "cae"
    )


def test_collectivite_activation_on_realtime_event_with_correct_format(
    bus: InMemoryDomainMessageBus,
    realtime: ReplayRealtime,
    env_variables: EnvironmentVariables,
):
    prepare_config_and_bus(bus, realtime, env_variables)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "collectivite_id": 1,
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "collectivite_activation_event",
            }
        ]
    )
    score_computed_events = spy_on_event(
        bus, events.ReferentielScoresForCollectiviteComputed
    )
    score_stored_events = spy_on_event(bus, events.ScoresForCollectiviteStored)

    realtime.start()

    assert len(score_computed_events) == 2
    assert len(score_stored_events) == 2

    assert (
        score_computed_events[0].referentiel
        == score_computed_events[0].referentiel
        == "eci"
    )
    assert (
        score_computed_events[1].referentiel
        == score_computed_events[1].referentiel
        == "cae"
    )
