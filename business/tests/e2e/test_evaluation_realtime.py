from typing import List
from time import time


import pytest

from business.core.domain.ports.domain_message_bus import (
    InMemoryDomainMessageBus,
)

from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.evaluation.domain.models import events
from business.utils.environment_variables import EnvironmentVariables
from business.utils.prepare_bus import prepare_bus
from business.evaluation.entrypoints.start_realtime import (
    EvaluationConfig,
    EVENT_HANDLERS,
)
from business.evaluation.domain.ports.realtime import (
    AbstractConverter,
    CollectiviteActionStatutUpdateConverter,
)
from tests.utils.spy_on_event import spy_on_event


referentiels_repo_json = "./data/referentiel_repository.json"


@pytest.fixture
def env_variables() -> EnvironmentVariables:
    return EnvironmentVariables(
        referentiels_repository="SUPABASE",
        labelisation_repositories="IN_MEMORY",
        realtime="REPLAY",
        referentiels_repo_file=referentiels_repo_json,  # This implies that CLI has already run and generated referentiels in this file
    )


@pytest.fixture
def bus() -> InMemoryDomainMessageBus:
    return InMemoryDomainMessageBus()


@pytest.fixture
def realtime(bus) -> ReplayRealtime:
    converters: List[AbstractConverter] = [CollectiviteActionStatutUpdateConverter()]
    return ReplayRealtime(bus, converters=converters)


# Note : for now, I'll commit the JSON referentiel, until we find something better !

# def wip_launch_cli_update_referentiels():  # TODO : Find a better (& lighter) way !
#     from business.entrypoints.referentiels import store_referentiels

#     store_referentiels(
#         repo_option="JSON",
#         to_json=referentiels_repo_json,
#         referentiel="eci",
#         actions=True,
#         indicateurs=True,
#         markdown_folder="../markdown",
#     )
#     store_referentiels(
#         repo_option="JSON",
#         to_json=referentiels_repo_json,
#         referentiel="cae",
#         actions=True,
#         indicateurs=True,
#         markdown_folder="../markdown",
#     )
#     store_referentiels(
#         repo_option="JSON",
#         to_json=referentiels_repo_json,
#         referentiel="crte",
#         actions=False,
#         indicateurs=True,
#         markdown_folder="../markdown",
#     )


def prepare_config_and_bus(
    bus: InMemoryDomainMessageBus,
    realtime: ReplayRealtime,
    env_variables: EnvironmentVariables,
):
    config = EvaluationConfig(bus, realtime=realtime, env_variables=env_variables)
    prepare_bus(config, EVENT_HANDLERS)

    # WIP : Prepare referentiel
    # wip_launch_cli_update_referentiels()


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
                    "collectivite_id": 1,
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

    start = time()
    realtime.start()
    duration_ms = (time() - start) * 1000

    assert len(score_computed_events) == 1
    assert len(score_stored_events) == 1

    assert (
        score_computed_events[0].collectivite_id
        == score_computed_events[0].collectivite_id
        == 1
    )
    assert (
        score_computed_events[0].referentiel
        == score_computed_events[0].referentiel
        == "cae"
    )

    assert duration_ms < 1000, "Computation took more than one second"
