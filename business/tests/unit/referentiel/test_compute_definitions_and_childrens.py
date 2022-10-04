import pytest

from business.referentiel.convert_actions import (
    compute_definitions_and_childrens,
    MarkdownError,
)
from business.utils.models.actions import ActionChildren, ActionId
from tests.utils.referentiel_factory import (
    make_action_definition,
    make_markdown_action_tree,
)


def test_import_referentiel_succeeds_when_all_is_good():
    markdown_root_action_node = make_markdown_action_tree(
        identifiant="", points=100, referentiel="eci"
    )
    markdown_root_action_node.actions = [
        make_markdown_action_tree(
            identifiant="1",
            points=30,
            actions=[
                make_markdown_action_tree(identifiant="1.1"),
                make_markdown_action_tree(identifiant="1.2"),
                make_markdown_action_tree(identifiant="1.3"),
            ],
        ),
        make_markdown_action_tree(
            identifiant="2",
            points=70,
            actions=[
                make_markdown_action_tree(identifiant="2.1"),
                make_markdown_action_tree(identifiant="2.2"),
            ],
        ),
    ]

    definitions, childrens = compute_definitions_and_childrens(
        markdown_root_action_node
    )
    assert definitions == [
        make_action_definition(
            action_id="eci",
            md_points=100.0,
            md_pourcentage=None,
            computed_points=100.0,
        ),
        make_action_definition(
            action_id="eci_1",
            md_points=30.0,
            md_pourcentage=None,
            computed_points=30.0,
        ),
        make_action_definition(
            action_id="eci_1.1",
            md_points=None,
            md_pourcentage=None,
            computed_points=10.0,
        ),
        make_action_definition(
            action_id="eci_1.2",
            md_points=None,
            md_pourcentage=None,
            computed_points=10.0,
        ),
        make_action_definition(
            action_id="eci_1.3",
            md_points=None,
            md_pourcentage=None,
            computed_points=10.0,
        ),
        make_action_definition(
            action_id="eci_2",
            md_points=70.0,
            md_pourcentage=None,
            computed_points=70.0,
        ),
        make_action_definition(
            action_id="eci_2.1",
            md_points=None,
            md_pourcentage=None,
            computed_points=35.0,
        ),
        make_action_definition(
            action_id="eci_2.2",
            md_points=None,
            md_pourcentage=None,
            computed_points=35.0,
        ),
    ]
    assert childrens == [
        ActionChildren(
            action_id=ActionId("eci"),
            children=[ActionId("eci_1"), ActionId("eci_2")],
            referentiel="eci",
        ),
        ActionChildren(
            action_id=ActionId("eci_1"),
            children=[
                ActionId("eci_1.1"),
                ActionId("eci_1.2"),
                ActionId("eci_1.3"),
            ],
            referentiel="eci",
        ),
        ActionChildren(action_id=ActionId("eci_1.1"), children=[], referentiel="eci"),
        ActionChildren(action_id=ActionId("eci_1.2"), children=[], referentiel="eci"),
        ActionChildren(action_id=ActionId("eci_1.3"), children=[], referentiel="eci"),
        ActionChildren(
            action_id=ActionId("eci_2"),
            children=[ActionId("eci_2.1"), ActionId("eci_2.2")],
            referentiel="eci",
        ),
        ActionChildren(action_id=ActionId("eci_2.1"), children=[], referentiel="eci"),
        ActionChildren(action_id=ActionId("eci_2.2"), children=[], referentiel="eci"),
    ]


def test_import_referentiel_succeeds_when_action_has_0_point():
    markdown_action_tree = make_markdown_action_tree(
        identifiant="", points=100, referentiel="eci"
    )
    markdown_action_tree.actions = [
        make_markdown_action_tree(identifiant="0"),
        make_markdown_action_tree(identifiant="1", points=100),
    ]

    definitions, _ = compute_definitions_and_childrens(markdown_action_tree)

    assert definitions == [
        make_action_definition(
            action_id="eci",
            md_points=100.0,
            md_pourcentage=None,
            computed_points=100.0,
        ),
        make_action_definition(
            action_id="eci_0",
            md_points=None,
            md_pourcentage=None,
            computed_points=0.0,
        ),
        make_action_definition(
            action_id="eci_1",
            md_points=100.0,
            md_pourcentage=None,
            computed_points=100.0,
        ),
    ]


def test_import_referentiel_fails_when_identifiants_are_not_unique():
    markdown_root_action_tree = make_markdown_action_tree(
        identifiant="root", points=100
    )
    markdown_root_action_tree.actions = [
        make_markdown_action_tree(identifiant="1"),
        make_markdown_action_tree(identifiant="1"),
    ]
    with pytest.raises(
        MarkdownError,
        match="Tous les identifiants devraient être uniques. Doublons: 1",
    ):
        compute_definitions_and_childrens(markdown_root_action_tree)


def test_check_referentiel_quotations_fails_when_percentage_level_isnt_100():
    markdown_action_tree = make_markdown_action_tree(identifiant="", points=500)
    markdown_action_tree.actions = [
        make_markdown_action_tree(identifiant="1", pourcentage=10),
        make_markdown_action_tree(identifiant="2", pourcentage=80),
    ]
    with pytest.raises(
        MarkdownError,
        match="Les valeurs des actions eci_1, eci_2 sont renseignées en pourcentage, mais leur somme fait 90.0 au lieu de 100.",
    ):
        compute_definitions_and_childrens(markdown_action_tree)


def test_points_are_equi_redistributed_amongst_siblings_when_one_action_worth_0_percent():
    markdown_action_tree = make_markdown_action_tree(identifiant="", points=100)
    markdown_action_tree.actions = [
        make_markdown_action_tree(identifiant="1", pourcentage=0),
        make_markdown_action_tree(identifiant="2"),
        make_markdown_action_tree(identifiant="3"),
    ]
    definitions, _ = compute_definitions_and_childrens(markdown_action_tree)
    assert definitions == [
        make_action_definition(
            action_id="eci",
            referentiel="eci",
            md_points=100.0,
            md_pourcentage=None,
            computed_points=100.0,
            categorie=None,
        ),
        make_action_definition(
            action_id="eci_1",
            referentiel="eci",
            md_points=None,
            md_pourcentage=0.0,
            computed_points=0.0,
        ),
        make_action_definition(
            action_id="eci_2",
            referentiel="eci",
            md_points=None,
            md_pourcentage=None,
            computed_points=50.0,
        ),
        make_action_definition(
            action_id="eci_3",
            referentiel="eci",
            md_points=None,
            md_pourcentage=None,
            computed_points=50.0,
        ),
    ]


def test_check_referentiel_quotations_fails_when_children_points_doesnt_sum_to_parent_point():
    markdown_action_tree = make_markdown_action_tree(identifiant="root", points=60)
    markdown_action_tree.actions = [
        make_markdown_action_tree(identifiant="1", points=10),
        make_markdown_action_tree(identifiant="2", points=51),
    ]
    with pytest.raises(
        MarkdownError,
        match="Les valeurs des actions de l'action eci_root sont renseignées en points, mais leur somme fait 61.0 au lieu de 60.0.",
    ):
        compute_definitions_and_childrens(markdown_action_tree)


def test_check_referentiel_quotations_handles_points_parent_propagation_when_necessary_and_fails_if_incoherent():
    tree = make_markdown_action_tree(identifiant="", points=20)
    action_1 = make_markdown_action_tree(
        identifiant="1", pourcentage=50
    )  # hence worth 10 points
    action_2 = make_markdown_action_tree(
        identifiant="2", pourcentage=50
    )  # hence worth 10 points
    tree.actions = [action_1, action_2]
    action_1.actions = [  # All good : it sums to 10
        make_markdown_action_tree(identifiant="1.1", points=8),
        make_markdown_action_tree(identifiant="1.2", points=2),
        make_markdown_action_tree(identifiant="1.3", points=0),
    ]
    action_2.actions = [  # Not good : it sums to 7 instead of 10
        make_markdown_action_tree(identifiant="2.1", points=7),
    ]

    with pytest.raises(
        MarkdownError,
        match="Les valeurs des actions de l'action eci_2 sont renseignées en points, mais leur somme fait 7.0 au lieu de 10.0.",
    ):
        compute_definitions_and_childrens(tree)


def test_check_referentiel_quotations_handles_children_propagation_when_necessary():
    tree = make_markdown_action_tree(identifiant="root", points=500)
    action_1 = make_markdown_action_tree(
        identifiant="1"
    )  # no points specified but children have points that sum to 400
    action_2 = make_markdown_action_tree(
        identifiant="2"
    )  # no points specified but children have points that sum to 99
    tree.actions = [action_1, action_2]

    action_1.actions = [
        make_markdown_action_tree(identifiant="1.1", points=100),
        make_markdown_action_tree(identifiant="1.2", points=200),
        make_markdown_action_tree(identifiant="1.3", points=100),
    ]

    action_2.actions = [
        make_markdown_action_tree(identifiant="2.1", points=99),
    ]

    with pytest.raises(
        MarkdownError,
        match="Les valeurs des actions de l'action eci_root sont renseignées en points, mais leur somme fait 499.0 au lieu de 500.0.",
    ):
        compute_definitions_and_childrens(tree)
