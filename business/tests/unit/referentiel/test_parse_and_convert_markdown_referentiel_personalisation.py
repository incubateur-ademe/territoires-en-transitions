from typing import Optional

from business.referentiel.domain.models.personnalisation import (
    ActionPersonnalisationRegles,
    Regle,
)

from business.referentiel.domain.use_cases.parse_and_convert_markdown_referentiel_personnalisations import (
    ParseAndConvertMarkdownReferentielRegles,
)
from business.utils.action_id import ActionId
from business.utils.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
    InMemoryReferentielRepository,
)
from business.referentiel.domain.models import events
from tests.utils.referentiel_factory import make_dummy_referentiel
from tests.utils.spy_on_event import spy_on_event


def prepare_use_case(
    folder_path: str,
    referentiel_repo: Optional[AbstractReferentielRepository] = None,
):
    test_command = events.QuestionMarkdownConvertedToEntities([], "", folder_path)
    bus = InMemoryDomainMessageBus()
    referentiel_repo = referentiel_repo or InMemoryReferentielRepository()

    use_case = ParseAndConvertMarkdownReferentielRegles(bus, referentiel_repo)

    failure_events = spy_on_event(bus, events.ReglesMarkdownParsingOrConvertionFailed)
    parsed_events = spy_on_event(
        bus, events.QuestionAndPersonnalisationMarkdownConvertedToEntities
    )
    use_case.execute(test_command)
    return failure_events, parsed_events


def test_parse_and_convert_markdown_referentiel_personnalisation_from_ok_folder():
    referentiel_repo = InMemoryReferentielRepository(
        *make_dummy_referentiel(
            action_ids=["eci_2.2", "cae_3.3.5", "cae_4.1.1"]
        )  # regles are applied on thoses actions, hence they should exist in repo (otherwise it fails)
    )
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_personnalisation_example_ok", referentiel_repo=referentiel_repo
    )
    assert len(failure_events) == 0
    assert len(parsed_events) == 1

    assert parsed_events[0].regles == [
        ActionPersonnalisationRegles(
            action_id=ActionId("cae_4.1.1"),
            titre="Petit titre sur la personnalisation de la cae 4.1.1",
            regles=[
                Regle(
                    formule="si reponse(mobilite_1, OUI) alors max(reponse(mobilite_2), 0.5) \n",
                    type="reduction",
                    description="<p>Pour une collectivité AOM, la réduction est proportionnelle</p>\n<p>à la participation dans la collectivité AOM dans la limite de 5 points (50%)</p>\n",
                ),
                Regle(
                    formule="reponse(dechets_1, NON) \n",
                    type="desactivation",
                    description="",
                ),
            ],
            description="",
        )
    ]


def test_parse_and_convert_markdown_referentiel_personnalisation_fails_if_action_id_are_unknown():
    failure_events, parsed_events = prepare_use_case(
        "./tests/data/md_personnalisation_example_ok"
    )
    assert len(failure_events) == 1
    assert len(parsed_events) == 0
    assert (
        failure_events[0].reason
        == "Incohérences dans la conversion de 1 regles: \nLes règles suivantes'appliquent à des actions inconnues: cae_4.1.1"
    )
