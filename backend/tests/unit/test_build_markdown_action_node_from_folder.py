from backend.utils.markdown_import.build_markdown_action_from_folder import (
    build_markdown_action_from_folder,
)
from backend.utils.markdown_import.markdown_action_node import MarkdownActionNode


def test_build_markdown_action_node_from_folder():
    md_action = build_markdown_action_from_folder(
        "./tests/data",
    )

    assert md_action == MarkdownActionNode(
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
