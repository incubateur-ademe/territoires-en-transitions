import pytest

from time import sleep
from business.domain.ports.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
)
from business.domain.ports.action_score_repo import (
    InMemoryActionScoreRepository,
)
from business.domain.ports.action_status_repo import (
    InMemoryActionStatusRepository,
)
from business.domain.ports.data_layer_event_bus import (
    InMemoryDataLayerEventBus,
)
from business.domain.models import commands, events
from business.entrypoints.prepare_bus import prepare_bus, Config
from tests.utils.spy_on_event import spy_on_event


@pytest.fixture
def config() -> Config:
    return Config(  # TODO : this should not be InMemory in E2E tests !
        referentiel_repo=InMemoryReferentielRepository(),
        score_repo=InMemoryActionScoreRepository(),
        statuses_repo=InMemoryActionStatusRepository(),
        domain_message_bus=InMemoryDomainMessageBus(),
        data_layer_event_bus=InMemoryDataLayerEventBus(),
    )


def test_action_status_updated(config: Config):
    bus = prepare_bus(config)

    score_computed_events = spy_on_event(bus, events.ReferentielScoresForEpciComputed)
    score_stored_events = spy_on_event(bus, events.ScoresForEpciStored)

    config.domain_message_bus.publish_command(
        commands.ParseMarkdownReferentielFolder(
            folder_path="./tests/data/md_referentiel_example_ok", referentiel_id="eci"
        )
    )

    config.domain_message_bus.publish_command(
        commands.ComputeReferentielScoresForEpci(epci_id="lyon", referentiel_id="eci")
    )

    sleep(3)
    assert len(score_computed_events) == 1
    assert len(score_stored_events) == 1
