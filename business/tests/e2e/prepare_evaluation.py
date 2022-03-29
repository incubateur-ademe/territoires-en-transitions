from typing import List

import pytest

from business.referentiel.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)
from business.utils.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.evaluation.adapters.replay_realtime import ReplayRealtime
from business.utils.environment_variables import EnvironmentVariables
from business.utils.prepare_bus import prepare_bus
from business.evaluation.entrypoints.start_realtime import (
    EvaluationConfig,
    EVENT_HANDLERS,
)
from business.evaluation.domain.ports.realtime import (
    AbstractConverter,
    CollectiviteActionStatutUpdateConverter,
    CollectiviteReponseUpdateConverter,
)
from tests.utils.supabase_fixtures import reset_supabase_client


@pytest.fixture
def bus() -> InMemoryDomainMessageBus:
    return InMemoryDomainMessageBus()


@pytest.fixture
def realtime(bus) -> ReplayRealtime:
    converters: List[AbstractConverter] = [
        CollectiviteActionStatutUpdateConverter(),
        CollectiviteReponseUpdateConverter(),
    ]
    return ReplayRealtime(bus, converters=converters)


def prepare_config_and_bus(
    bus: InMemoryDomainMessageBus,
    realtime: ReplayRealtime,
    env_variables: EnvironmentVariables,
):
    config = EvaluationConfig(bus, realtime=realtime, env_variables=env_variables)
    if isinstance(config.referentiel_repo, SupabaseReferentielRepository):
        reset_supabase_client(config.referentiel_repo.client)

    prepare_bus(config, EVENT_HANDLERS)
