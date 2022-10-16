from business.referentiel.convert_actions import (
    parse_markdown_action_trees_from_folder,
    MarkdownActionTree,
)


def test_build_markdown_action_node_from_ok_folder():
    markdown_action_nodes, errors = parse_markdown_action_trees_from_folder(
        "./tests/data/md_referentiel_example_ok"
    )

    assert len(errors) == 0
    assert len(markdown_action_nodes) == 3

    expected_markdown_action_nodes = [
        MarkdownActionTree(
            identifiant="1",
            nom="Titre de l'action 1",
            thematique_id="",
            description="",
            contexte="",
            exemples="",
            ressources="",
            reduction_de_potentiel="",
            perimetre_de_levaluation="",
            referentiel=None,
            points=100.0,
            pourcentage=None,
            categorie=None,
            actions=[],
        ),
        MarkdownActionTree(
            identifiant="1.1",
            nom="Titre de l'action 1.1",
            thematique_id="",
            description="<p><strong>Première partie</strong></p>\n<p>Description de l&#x27;action 1.1</p>\n",
            contexte="<p>Contexte de l&#x27;action 1.1.</p>\n<p>Après être allé à la ligne !</p>\n",
            exemples="<p>Exemples de l&#x27;action 1.1</p>\n",
            ressources="<p>Ressources de l&#x27;action 1.1</p>\n",
            reduction_de_potentiel="<p>Réduction de potentiel de l&#x27;action 1.1</p>\n",
            perimetre_de_levaluation="<p>Périmètre de l&#x27;évaluation de l&#x27;action 1.1</p>\n",
            referentiel=None,
            points=None,
            pourcentage=None,
            categorie=None,
            actions=[
                MarkdownActionTree(
                    identifiant="1.1.1",
                    nom="Titre de l'action 1.1.1",
                    thematique_id="",
                    description="<p>Description de l&#x27;action 1.1.1</p>\n",
                    contexte="<p>Contexte de l&#x27;action 1.1.1</p>\n",
                    exemples="<p>Exemples de l&#x27;action 1.1.1</p>\n",
                    ressources="<p>Ressources de l&#x27;action 1.1.1</p>\n",
                    reduction_de_potentiel="",
                    perimetre_de_levaluation="",
                    referentiel=None,
                    points=20.0,
                    pourcentage=None,
                    categorie=None,
                    actions=[
                        MarkdownActionTree(
                            identifiant="1.1.1.1",
                            nom="Titre de l'action 1.1.1.1",
                            thematique_id="",
                            description="",
                            contexte="",
                            exemples="",
                            ressources="",
                            reduction_de_potentiel="",
                            perimetre_de_levaluation="",
                            referentiel=None,
                            points=None,
                            pourcentage=20.0,
                            categorie="bases",
                            actions=[],
                        ),
                        MarkdownActionTree(
                            identifiant="1.1.1.2",
                            nom="Titre de l'action 1.1.1.2",
                            thematique_id="",
                            description="",
                            contexte="",
                            exemples="",
                            ressources="",
                            reduction_de_potentiel="",
                            perimetre_de_levaluation="",
                            referentiel=None,
                            points=None,
                            pourcentage=30.0,
                            categorie="mise en œuvre",
                            actions=[],
                        ),
                        MarkdownActionTree(
                            identifiant="1.1.1.3",
                            nom="Titre de l'action 1.1.1.3",
                            thematique_id="",
                            description="",
                            contexte="",
                            exemples="",
                            ressources="",
                            reduction_de_potentiel="",
                            perimetre_de_levaluation="",
                            referentiel=None,
                            points=None,
                            pourcentage=50.0,
                            categorie="effets",
                            actions=[],
                        ),
                    ],
                ),
                MarkdownActionTree(
                    identifiant="1.1.2",
                    nom="Titre de l'action 1.1.2",
                    thematique_id="",
                    description="<p>Description de l&#x27;action 1.1.2</p>\n",
                    contexte="<p>Contexte de l&#x27;action 1.1.2</p>\n",
                    exemples="<p>Exemples de l&#x27;action 1.1.2</p>\n",
                    ressources="<p>Ressources de l&#x27;action 1.1.2</p>\n",
                    reduction_de_potentiel="",
                    perimetre_de_levaluation="",
                    referentiel=None,
                    points=80.0,
                    pourcentage=None,
                    categorie=None,
                    actions=[],
                ),
            ],
        ),
        MarkdownActionTree(
            identifiant="",
            nom="Titre du référentiel",
            thematique_id="",
            description="",
            contexte="",
            exemples="",
            ressources="",
            reduction_de_potentiel="",
            perimetre_de_levaluation="",
            referentiel="eci",
            points=100.0,
            pourcentage=None,
            categorie=None,
            actions=[],
        ),
    ]
    assert sorted(
        markdown_action_nodes, key=lambda action: action.identifiant
    ) == sorted(expected_markdown_action_nodes, key=lambda action: action.identifiant)


def test_build_markdown_action_node_when_referentiel_is_unknown():

    markdown_action_nodes, errors = parse_markdown_action_trees_from_folder(
        folder_path="./tests/data/md_referentiel_examples_nok/unknown_referentiel",
    )

    assert len(errors) == 1
    assert (
        errors[0]
        == "1 validation error for MarkdownActionTree\nreferentiel\n  unexpected value; permitted: 'cae', 'eci' (type=value_error.const; given=some_new_fancy_referentiel; permitted=('cae', 'eci'))"
    )
