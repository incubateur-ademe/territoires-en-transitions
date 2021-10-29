from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.use_cases.parse_markdown_referentiel_folder import (
    ParseMarkdownReferentielFolder,
)
from business.domain.models import commands, events
from tests.utils.spy_on_event import spy_on_event


def test_build_markdown_action_node_from_ok_folder():
    test_command = commands.ParseMarkdownReferentielFolder(
        folder_path="./tests/data/md_referentiel_example_ok", referentiel_id="eci"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    expected_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_command)

    assert len(failure_events) == 0
    assert len(expected_events) == 1

    expected_event = events.MarkdownReferentielFolderParsed(
        referentiel_node=MarkdownActionNode(
            referentiel_id= "eci",
            identifiant="",
            nom="Titre du référentiel",
            thematique_id="",
            description="",
            contexte="",
            exemples="",
            ressources="",
            points=100,
            actions=[
                MarkdownActionNode(
                    referentiel_id=None,
                    identifiant="1",
                    nom="Titre de l'action 1",
                    thematique_id="",
                    description="",
                    contexte="",
                    exemples="",
                    ressources="",
                    points=100,
                    percentage=None,
                    actions=[
                        MarkdownActionNode(
                            referentiel_id=None,
                            identifiant="1.1",
                            nom="Titre de l'action 1.1",
                            thematique_id="",
                            description="",
                            contexte="",
                            exemples="",
                            ressources="",
                            points=30.0,
                            percentage=None,
                            actions=[
                                MarkdownActionNode(
                                    referentiel_id=None,
                                    identifiant="1.1.1",
                                    nom="Titre de l'action 1.1.1",
                                    thematique_id="",
                                    description="",
                                    contexte="",
                                    exemples="",
                                    ressources="",
                                    points=20.0,
                                    percentage=None,
                                    actions=[
                                        MarkdownActionNode(
                                            referentiel_id=None,
                                            identifiant="1.1.1.1",
                                            nom="Titre de l'action 1.1.1.1",
                                            thematique_id="",
                                            description="",
                                            contexte="",
                                            exemples="",
                                            ressources="",
                                            points=None,
                                            percentage=20.0,
                                            actions=[],
                                        ),
                                        MarkdownActionNode(
                                            referentiel_id=None,
                                            identifiant="1.1.1.2",
                                            nom="Titre de l'action 1.1.1.2",
                                            thematique_id="",
                                            description="",
                                            contexte="",
                                            exemples="",
                                            ressources="",
                                            points=None,
                                            percentage=30.0,
                                            actions=[],
                                        ),
                                        MarkdownActionNode(
                                            referentiel_id=None,
                                            identifiant="1.1.1.3",
                                            nom="Titre de l'action 1.1.1.3",
                                            thematique_id="",
                                            description="",
                                            contexte="",
                                            exemples="",
                                            ressources="",
                                            points=None,
                                            percentage=50.0,
                                            actions=[],
                                        ),
                                    ],
                                )
                            ],
                        )
                    ],
                )
            ],
        )
    )
    assert expected_events[0] == expected_event


def test_build_markdown_action_node_when_referentiel_id_is_unknown():
    test_command = commands.ParseMarkdownReferentielFolder(
        folder_path="./tests/data/md_referentiel_examples_nok/unknown_referentiel_id", referentiel_id="eci"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    success_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_command)

    assert len(failure_events) == 1
    assert len(success_events) == 0

    assert failure_events[0].reason == "1 validation error for MarkdownActionNode\nreferentiel_id\n  unexpected value; permitted: 'eci', 'cae' (type=value_error.const; given=some_new_fancy_referentiel_id; permitted=('eci', 'cae'))"

def test_build_markdown_action_node_when_no_action_root():
    test_command = commands.ParseMarkdownReferentielFolder(
        folder_path="./tests/data/md_referentiel_examples_nok/no_root", referentiel_id="eci"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    success_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_command)

    assert len(failure_events) == 1
    assert len(success_events) == 0

    assert failure_events[0].reason == "Le dossier de markdowns doit contenir une unique action racine (dont l'identifiant est ''). 0 trouvé(s)."

def test_build_markdown_action_node_when_orphan_nodes():
    test_command = commands.ParseMarkdownReferentielFolder(
        folder_path="./tests/data/md_referentiel_examples_nok/orphan_nodes", referentiel_id="eci"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    success_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_command)

    assert len(failure_events) == 1
    assert len(success_events) == 0

    assert failure_events[0].reason == "Il manque un niveau entre l'action 1 et son enfant 1.1.1"