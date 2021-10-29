from business.domain import use_cases
from business.domain.models.markdown_action_node import MarkdownActionNode
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.use_cases.parse_markdown_referentiel_folder import (
    ParseMarkdownReferentielFolder,
)
from business.domain.models import commands, events
from tests.utils.spy_on_event import spy_on_event


def test_build_markdown_action_node_from_folder():
    test_command = commands.ParseMarkdownReferentielFolder(
        folder_path="./tests/data", referentiel_id="eci"
    )
    bus = InMemoryDomainMessageBus()
    use_case = ParseMarkdownReferentielFolder(bus=bus)
    use_case.execute(test_command)

    published_events = spy_on_event(bus, events.MarkdownReferentielFolderParsed)

    assert len(published_events) == 1

    expected_event = events.MarkdownReferentielFolderParsed(
        referentiel_node=MarkdownActionNode(
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
    assert published_events[0] == expected_event
