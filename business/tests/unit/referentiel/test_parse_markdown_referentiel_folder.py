from business.referentiel.domain.models.markdown_action_node import MarkdownActionNode
from business.utils.domain_message_bus import (
    InMemoryDomainMessageBus,
)
from business.referentiel.domain.use_cases.parse_markdown_referentiel_folder import (
    ParseMarkdownReferentielFolder,
)
from business.referentiel.domain.models import events
from tests.utils.spy_on_event import spy_on_event


def test_build_markdown_action_node_from_ok_folder():
    test_trigger = events.MarkdownReferentielFolderUpdated(
        folder_path="./tests/data/md_referentiel_example_ok"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    parsed_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_trigger)

    assert len(failure_events) == 0
    assert len(parsed_events) == 1
    expected_event = events.MarkdownReferentielFolderParsed(
        referentiel_node=MarkdownActionNode(
            referentiel="eci",
            identifiant="",
            nom="Titre du référentiel",
            thematique_id="",
            description="",
            contexte="",
            exemples="",
            preuve="",
            ressources="",
            points=100.0,
            pourcentage=None,
            categorie=None,
            actions=[
                MarkdownActionNode(
                    referentiel=None,
                    identifiant="1",
                    nom="Titre de l'action 1",
                    thematique_id="",
                    description="",
                    contexte="",
                    exemples="",
                    preuve="",
                    ressources="",
                    points=100,
                    pourcentage=None,
                    categorie=None,
                    actions=[
                        MarkdownActionNode(
                            referentiel=None,
                            identifiant="1.1",
                            nom="Titre de l'action 1.1",
                            thematique_id="",
                            description="<p><strong>Première partie</strong></p>\n<p>Description de l'action 1.1</p>\n",
                            contexte="<p>Contexte de l'action 1.1.</p>\n<p>Après être allé à la ligne !</p>\n",
                            exemples="<p>Exemples de l'action 1.1</p>\n",
                            preuve="",
                            ressources="<p>Ressources de l'action 1.1</p>\n",
                            reduction_de_potentiel="<p>Réduction de potentiel de l'action 1.1</p>\n",
                            perimetre_de_levaluation="<p>Périmètre de l'évaluation de l'action 1.1</p>\n",
                            points=30.0,
                            pourcentage=None,
                            categorie=None,
                            actions=[
                                MarkdownActionNode(
                                    referentiel=None,
                                    identifiant="1.1.1",
                                    nom="Titre de l'action 1.1.1",
                                    thematique_id="",
                                    description="<p>Description de l'action 1.1.1</p>\n",
                                    contexte="<p>Contexte de l'action 1.1.1</p>\n",
                                    exemples="<p>Exemples de l'action 1.1.1</p>\n",
                                    ressources="<p>Ressources de l'action 1.1.1</p>\n",
                                    points=20.0,
                                    pourcentage=None,
                                    categorie=None,
                                    actions=[
                                        MarkdownActionNode(
                                            referentiel=None,
                                            identifiant="1.1.1.1",
                                            nom="Titre de l'action 1.1.1.1",
                                            thematique_id="",
                                            description="",
                                            contexte="",
                                            exemples="",
                                            preuve="",
                                            ressources="",
                                            points=None,
                                            pourcentage=20.0,
                                            categorie="bases",
                                            actions=[],
                                        ),
                                        MarkdownActionNode(
                                            referentiel=None,
                                            identifiant="1.1.1.2",
                                            nom="Titre de l'action 1.1.1.2",
                                            thematique_id="",
                                            description="",
                                            contexte="",
                                            exemples="",
                                            preuve="",
                                            ressources="",
                                            points=None,
                                            pourcentage=30.0,
                                            categorie="mise en œuvre",
                                            actions=[],
                                        ),
                                        MarkdownActionNode(
                                            referentiel=None,
                                            identifiant="1.1.1.3",
                                            nom="Titre de l'action 1.1.1.3",
                                            thematique_id="",
                                            description="",
                                            contexte="",
                                            exemples="",
                                            preuve="",
                                            ressources="",
                                            points=None,
                                            pourcentage=50.0,
                                            categorie="effets",
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
    assert parsed_events[0] == expected_event


def test_build_markdown_action_node_when_referentiel_is_unknown():
    test_trigger = events.MarkdownReferentielFolderUpdated(
        folder_path="./tests/data/md_referentiel_examples_nok/unknown_referentiel",
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    success_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_trigger)

    assert len(failure_events) == 1
    assert len(success_events) == 0

    assert (
        failure_events[0].reason
        == "1 validation error for MarkdownActionNode\nreferentiel\n  unexpected value; permitted: 'eci', 'cae', 'crte' (type=value_error.const; given=some_new_fancy_referentiel; permitted=('eci', 'cae', 'crte'))"
    )


def test_build_markdown_action_node_when_no_action_root():
    test_trigger = events.MarkdownReferentielFolderUpdated(
        folder_path="./tests/data/md_referentiel_examples_nok/no_root",
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    empty_folder_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderEmpty)
    success_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_trigger)

    assert len(empty_folder_events) == 1
    assert len(success_events) == 0


def test_build_markdown_action_node_when_orphan_nodes():
    test_trigger = events.MarkdownReferentielFolderUpdated(
        folder_path="./tests/data/md_referentiel_examples_nok/orphan_nodes"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)

    failure_events = spy_on_event(bus, events.ParseMarkdownReferentielFolderFailed)
    success_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    use_case.execute(test_trigger)

    assert len(failure_events) == 1
    assert len(success_events) == 0

    assert (
        failure_events[0].reason
        == "Il manque un niveau entre l'action 1 et son enfant 1.1.1"
    )
