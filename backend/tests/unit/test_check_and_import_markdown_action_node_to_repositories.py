from typing import Tuple
import pytest

from backend.domain.ports.action_children_repo import InMemoryActionChildrenRepository
from backend.domain.ports.action_definition_repo import (
    InMemoryActionDefinitionRepository,
)
from backend.domain.ports.action_points_repo import InMemoryActionPointsRepository

from backend.domain.use_cases.check_and_import_markdown_action_node_to_repositories import (
    ReferentielQuotationsError,
    CheckAndImportMarkdownActionNodeToRepositories,
)
from backend.utils.markdown_import.markdown_action_node import MarkdownActionNode
from tests.utils.referentiel_factory import (
    make_markdown_action_node,
    set_markdown_action_node_children_with_points,
)


def prepare_use_case(
    markdown_root_action_node: MarkdownActionNode,
) -> Tuple[
    CheckAndImportMarkdownActionNodeToRepositories,
    InMemoryActionDefinitionRepository,
    InMemoryActionChildrenRepository,
    InMemoryActionPointsRepository,
]:
    action_def_repo = InMemoryActionDefinitionRepository()
    action_children_repo = InMemoryActionChildrenRepository()
    action_points_repo = InMemoryActionPointsRepository()
    check_referentiel_points = CheckAndImportMarkdownActionNodeToRepositories(
        markdown_root_action_node,
        action_def_repo,
        action_children_repo,
        action_points_repo,
    )
    return (
        check_referentiel_points,
        action_def_repo,
        action_children_repo,
        action_points_repo,
    )


def test_import_referentiel_fails_when_identifiants_are_not_unique():

    markdown_root_action_node = make_markdown_action_node(
        identifiant="root", points=100
    )
    markdown_root_action_node.actions = [
        make_markdown_action_node(identifiant="1"),
        make_markdown_action_node(identifiant="1"),
    ]
    (
        check_referentiel_points,
        action_def_repo,
        action_children_repo,
        action_points_repo,
    ) = prepare_use_case(markdown_root_action_node)

    with pytest.raises(ReferentielQuotationsError) as error_message:
        check_referentiel_points.execute()
    assert (
        str(error_message.value)
        == "Tous les identifiants devraient être uniques. Doublons: "
    )
    # All repo should remain empty since referentiel is not coherent.
    assert (
        len(action_def_repo.entities)
        == len(action_children_repo.entities)
        == len(action_points_repo.entities)
        == 0
    )


def test_check_referentiel_quotations_fails_when_percentage_level_isnt_100():

    markdown_root_action_node = make_markdown_action_node(identifiant="root")
    markdown_root_action_node.actions = [
        make_markdown_action_node(identifiant="1", percentage=10),
        make_markdown_action_node(identifiant="2", percentage=80),
    ]
    (
        check_referentiel_points,
        action_def_repo,
        action_children_repo,
        action_points_repo,
    ) = prepare_use_case(markdown_root_action_node)

    with pytest.raises(ReferentielQuotationsError) as error_message:
        check_referentiel_points.execute()

    assert (
        str(error_message.value)
        == "Les valeurs des actions de l'action root sont renseignées en pourcentage, mais leur somme fait 90.0 au lieu de 100."
    )
    # All repo should remain empty since referentiel is not coherent.
    assert (
        len(action_def_repo.entities)
        == len(action_children_repo.entities)
        == len(action_points_repo.entities)
        == 0
    )


def test_check_referentiel_quotations_fails_when_children_points_doesnt_sum_to_parent_point():

    markdown_root_action_node = make_markdown_action_node(identifiant="root", points=60)
    set_markdown_action_node_children_with_points(markdown_root_action_node, [10, 51])

    (
        check_referentiel_points,
        action_def_repo,
        action_children_repo,
        action_points_repo,
    ) = prepare_use_case(markdown_root_action_node)

    with pytest.raises(ReferentielQuotationsError) as error_message:
        check_referentiel_points.execute()

    assert (
        str(error_message.value)
        == "Les valeurs des actions de l'action eci_root sont renseignées en points, mais leur somme fait 61.0 au lieu de 60.0."
    )
    # All repo should remain empty since referentiel is not coherent.
    assert (
        len(action_def_repo.entities)
        == len(action_children_repo.entities)
        == len(action_points_repo.entities)
        == 0
    )


def test_check_referentiel_quotations_handles_points_parent_propagation_when_necessary_and_fails_if_incoherent():
    root_action = make_markdown_action_node(identifiant="", points=20)
    action_1 = make_markdown_action_node(
        identifiant="1", percentage=50
    )  # hence worth 10 points
    action_2 = make_markdown_action_node(
        identifiant="2", percentage=50
    )  # hence worth 10 points
    root_action.actions = [action_1, action_2]
    action_1.actions = [  # All good : it sums to 10
        make_markdown_action_node(identifiant="1.1", points=8),
        make_markdown_action_node(identifiant="1.2", points=2),
        make_markdown_action_node(identifiant="1.3", points=0),
    ]
    action_2.actions = [  # Not good : it sums to 7 instead of 10
        make_markdown_action_node(identifiant="2.1", points=7),
    ]
    (
        check_referentiel_points,
        action_def_repo,
        action_children_repo,
        action_points_repo,
    ) = prepare_use_case(root_action)

    with pytest.raises(ReferentielQuotationsError) as error_message:
        check_referentiel_points.execute()

    assert (
        str(error_message.value)
        == "Les valeurs des actions de l'action eci_2 sont renseignées en points, mais leur somme fait 7.0 au lieu de 10.0."
    )
    # All repo should remain empty since referentiel is not coherent.
    assert (
        len(action_def_repo.entities)
        == len(action_children_repo.entities)
        == len(action_points_repo.entities)
        == 0
    )


def test_check_referentiel_quotations_handles_children_propagation_when_necessary():
    root_action = make_markdown_action_node(identifiant="root", points=500)
    action_1 = make_markdown_action_node(
        identifiant="1"
    )  # no points specified but children have points that sum to 400
    action_2 = make_markdown_action_node(
        identifiant="2"
    )  # no points specified but children have points that sum to 99
    root_action.actions = [action_1, action_2]

    set_markdown_action_node_children_with_points(action_1, [100, 200, 100])
    set_markdown_action_node_children_with_points(action_2, [99])

    (
        check_referentiel_points,
        action_def_repo,
        action_children_repo,
        action_points_repo,
    ) = prepare_use_case(root_action)

    with pytest.raises(ReferentielQuotationsError) as error_message:
        check_referentiel_points.execute()

    assert (
        str(error_message.value)
        == "Les valeurs des actions de l'action eci_root sont renseignées en points, mais leur somme fait 499.0 au lieu de 500.0."
    )
    # All repo should remain empty since referentiel is not coherent.
    assert (
        len(action_def_repo.entities)
        == len(action_children_repo.entities)
        == len(action_points_repo.entities)
        == 0
    )
