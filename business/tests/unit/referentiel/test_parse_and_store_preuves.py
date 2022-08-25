from typing import Optional

from business.referentiel.domain.models.preuve import Preuve, PreuveId
from business.utils.domain_message_bus import (
    DomainFailureEvent,
    InMemoryDomainMessageBus,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
    InMemoryReferentielRepository,
)
from business.referentiel.domain.use_cases.parse_and_store_preuves import (
    ParseAndStorePreuves,
)
from business.referentiel.domain.models import events
from business.utils.action_id import ActionId
from tests.utils.referentiel_factory import make_dummy_referentiel
from tests.utils.spy_on_event import spy_on_event


def prepare_use_case(
    folder_path: str,
    referentiel_repo: Optional[AbstractReferentielRepository] = None,
):
    test_command = events.ParseAndStorePreuvesTriggered(folder_path=folder_path)
    bus = InMemoryDomainMessageBus()
    referentiel_repo = referentiel_repo or InMemoryReferentielRepository()

    use_case = ParseAndStorePreuves(bus, referentiel_repo)

    failure_events = spy_on_event(bus, DomainFailureEvent)
    use_case.execute(test_command)
    return failure_events


def test_fails_when_markdown_preuves_refers_to_unknown_action_ids():
    failure_events = prepare_use_case("./tests/data/md_preuves_example_ok")
    # Referentiel repo is empty, hence, action1.1.1 and 1.1.3 refered
    # in preuves are unknwown
    assert len(failure_events) == 1
    assert (
        failure_events[0].reason
        == "La preuve cae_preuve_1.a référence l'action cae_1.1.1 qui n'existe pas.\nLa preuve cae_preuve_1.b référence l'action cae_1.1.2 qui n'existe pas."
    )


def test_parse_and_convert_markdown_preuves_to_entities_from_ok_folder():
    # Add actions cae_1.1.1 and cae_1.1.3 in repo
    referentiel_repo = InMemoryReferentielRepository(
        *make_dummy_referentiel(action_ids=["cae_1.1.1", "cae_1.1.2"])
    )
    failure_events = prepare_use_case(
        "./tests/data/md_preuves_example_ok", referentiel_repo=referentiel_repo
    )
    assert len(failure_events) == 0
    assert referentiel_repo._preuves == [
        Preuve(
            id=PreuveId("cae_preuve_1.a"),
            nom="Nom de la preuve 1.a",
            action_id=ActionId("cae_1.1.1"),
            description="<p>Description de la preuve 1.a</p>\n",
        ),
        Preuve(
            id=PreuveId("cae_preuve_1.b"),
            nom="Nom de la preuve 1.b",
            action_id=ActionId("cae_1.1.2"),
            description="<p>Description de la preuve 1.b</p>\n",
        ),
    ]
