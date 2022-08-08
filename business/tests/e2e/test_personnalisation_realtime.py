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


def test_reponse_updated_on_realtime_event_with_correct_format(
    bus: InMemoryDomainMessageBus,
    realtime: ReplayRealtime,
    env_variables: EnvironmentVariables,
):
    prepare_config_and_bus(bus, realtime, env_variables)

    realtime.set_events_to_emit(
        [
            {
                "record": {
                    "collectivite_id": 8,
                    "created_at": "2020-01-01T12",
                    "id": 42,
                },
                "table": "reponse_update_event",
            }
        ]
    )

    trigger_compute_personnalisation_events = spy_on_event(
        bus, events.TriggerPersonnalisationForCollectivite
    )

    personnalisation_stored_events = spy_on_event(
        bus, events.PersonnalisationForCollectiviteStored
    )
    personnalisation_computation_failure_events = spy_on_event(
        bus, events.PersonnalisationForCollectiviteFailed
    )
    new_scores_stored_events = spy_on_event(bus, events.ScoresForCollectiviteStored)

    realtime.start()

    assert len(trigger_compute_personnalisation_events) == 1
    assert len(personnalisation_computation_failure_events) == 0
    assert len(personnalisation_stored_events) == 1
    assert len(new_scores_stored_events) == 2

    assert (
        personnalisation_stored_events[0].collectivite_id
        == personnalisation_stored_events[0].collectivite_id
        == 8
    )
