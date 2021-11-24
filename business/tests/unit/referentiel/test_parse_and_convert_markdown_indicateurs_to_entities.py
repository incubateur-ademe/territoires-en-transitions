from pathlib import Path
from typing import Optional


from business.referentiel.domain.models.indicateur import Indicateur, IndicateurId
from business.core.domain.ports.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
    InMemoryReferentielRepository,
    Referentiel,
)
from business.referentiel.domain.use_cases.parse_and_convert_markdown_indicateurs_to_entities import (
    ParseAndConvertMarkdownIndicateursToEntities,
)
from business.referentiel.domain.models import events
from business.utils.action_id import ActionId
from tests.utils.referentiel_factory import make_dummy_referentiel
from tests.utils.spy_on_event import spy_on_event


def prepare_use_case(
    folder_path: str,
    referentiel_repo: Optional[AbstractReferentielRepository] = None,
    referentiel: Referentiel = "cae",
):
    test_command = events.ParseAndConvertMarkdownIndicateursToEntitiesTriggered(
        folder_path=folder_path, referentiel=referentiel
    )
    bus = InMemoryDomainMessageBus()
    referentiel_repo = referentiel_repo or InMemoryReferentielRepository()
    # indicateur_repo = InMemoryIndicateurRepository()

    use_case = ParseAndConvertMarkdownIndicateursToEntities(
        bus, referentiel_repo  # indicateur_repo
    )

    failure_events = spy_on_event(
        bus, events.IndicateurMarkdownParsingOrConvertionFailed
    )
    parsed_events = spy_on_event(bus, events.IndicateurMarkdownConvertedToEntities)
    use_case.execute(test_command)
    return failure_events, parsed_events


def test_fails_when_markdown_indicateurs_refers_to_unknown_action_ids():
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_indicateurs_example_ok"
    )
    # Referentiel repo is empty, hence, action1.1.1 and 1.1.3 refered
    # in indicateurs are unknwown
    assert len(failure_events) == 1
    assert len(parsed_events) == 0
    assert (
        failure_events[0].reason
        == "Incohérences dans la conversion de 2 indicateurs: \nL'indicateur cae-1a référence des actions qui n'existent pas dans la base de donnée: cae_1.1.1.\nL'indicateur cae-1b référence des actions qui n'existent pas dans la base de donnée: cae_1.1.3."
    )


def test_parse_and_convert_markdown_indicateurs_to_entities_from_ok_folder():
    # Add actions cae_1.1.1 and cae_1.1.3 in repo
    referentiel_repo = InMemoryReferentielRepository(
        *make_dummy_referentiel(action_ids=["cae_1.1.1", "cae_1.1.3"])
    )
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_indicateurs_example_ok", referentiel_repo=referentiel_repo
    )
    assert len(failure_events) == 0
    assert len(parsed_events) == 1

    assert parsed_events[0].indicateurs == [
        Indicateur(
            indicateur_id=IndicateurId("cae-1a"),
            identifiant="1.a",
            nom="Nom de l'indicateur 1.a",
            unite="CO2",
            climat_pratic_ids=["strategie"],
            action_ids=[ActionId("cae_1.1.1")],
            programmes=["cae", "pcaet"],
            description="Description de l'indicateur 1.a\n\n",
            values_refers_to=None,
        ),
        Indicateur(
            indicateur_id=IndicateurId("cae-1b"),
            identifiant="1.b",
            nom="Nom de l'indicateur 1.b",
            unite="CO2/hab",
            climat_pratic_ids=["strategie"],
            action_ids=[ActionId("cae_1.1.3")],
            programmes=["cae"],
            description="Description de l'indicateur 1.b\n\n",
            values_refers_to=None,
        ),
    ]


def test_fails_when_valeur_refers_to_unknown_indicateur_id():
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_indicateurs_wrong_valeur"
    )

    # Referentiel repo is empty, hence, action1.1.1 and 1.1.3 refered
    # in indicateurs are unknwown
    assert len(failure_events) == 1
    assert len(parsed_events) == 0

    assert (
        failure_events[0].reason
        == "Incohérences dans la conversion de 1 indicateurs: \nL'indicateur cae-1a référence dans `valeur` un id d'indicateur qui n'existe pas dans la base de données: unknown_action_id"
    )
