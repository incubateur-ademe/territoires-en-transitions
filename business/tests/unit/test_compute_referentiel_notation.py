from typing import Dict, List
from business.domain.models.action_notation import ActionNotation
from business.domain.models.action_status import ActionStatus
from business.domain.models.litterals import ActionId
from business.domain.ports.action_children_repo import InMemoryActionChildrenRepository
from business.domain.ports.action_points_repo import InMemoryActionPointsRepository
from business.domain.use_cases.compute_referentiel_notation import (
    ComputeReferentielNotation,
)
from tests.utils.referentiel_factory import (
    make_action_children,
    make_action_points,
)

action_childrens = [
    make_action_children("root", ["1", "2"]),
    make_action_children("1", ["1.1", "1.2"]),
    make_action_children("2", ["2.0", "2.1"]),
]

action_points = [
    make_action_points(action_id="root", points=100),
    make_action_points(action_id="1", points=30),
    make_action_points(action_id="2", points=70),
    make_action_points(action_id="1.1", points=10),
    make_action_points(action_id="1.2", points=20),
    make_action_points(action_id="2.0", points=0),
    make_action_points(action_id="2.1", points=70),
]
# root_action = make_action_points(action_id="root", points=100)
# action_1 = make_action_points(action_id="1", points=30)
# action_2 = make_action_points(action_id="2", points=70)
# tache_1_1 = make_action_points(action_id="1.1", points=10)
# tache_1_2 = make_action_points(action_id="1.2", points=20)
# tache_2_0 = make_action_points(action_id="2.0", points=0)
# tache_2_1 = make_action_points(action_id="2.1", points=70)
# root_action.actions_ids = [ActionId("1"), ActionId("2")]
# action_1.actions_ids = [ActionId("1.1"), ActionId("1.2")]
# action_2.actions_ids = [tache_2_0.action_id, tache_2_1.action_id]

action_points_repo = InMemoryActionPointsRepository(action_points)
children_points_repo = InMemoryActionChildrenRepository(action_childrens)

compute_referentiel_notation = ComputeReferentielNotation(
    action_points_repo, children_points_repo
)


def test_notation_when_one_tache_is_faite():
    action_statuses: List[ActionStatus] = [
        ActionStatus(action_id=ActionId("1.1"), avancement="faite", concernee=True)
    ]
    actual_notation = compute_referentiel_notation.execute(action_statuses)

    assert len(actual_notation) == 4

    assert actual_notation[ActionId("1.1")] == ActionNotation(
        action_id=ActionId("1.1"),
        points=10,
        previsionnel=10,
        potentiel=10,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=True,
    )
    assert actual_notation[ActionId("1")] == ActionNotation(
        action_id=ActionId("1"),
        points=10,
        previsionnel=10,
        potentiel=30,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("2")] == ActionNotation(
        action_id=ActionId("2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("root")] == ActionNotation(
        action_id=ActionId("root"),
        points=10,
        previsionnel=10,
        potentiel=100,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_one_tache_is_programmee():
    action_statuses: List[ActionStatus] = [
        ActionStatus(action_id=ActionId("1.1"), avancement="programmee", concernee=True)
    ]
    actual_notation = compute_referentiel_notation.execute(action_statuses)

    assert len(actual_notation) == 4

    assert actual_notation[ActionId("1.1")] == ActionNotation(
        action_id=ActionId("1.1"),
        points=0,
        previsionnel=10,
        potentiel=10,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=True,
    )
    assert actual_notation[ActionId("1")] == ActionNotation(
        action_id=ActionId("1"),
        points=0,
        previsionnel=10,
        potentiel=30,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("2")] == ActionNotation(
        action_id=ActionId("2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("root")] == ActionNotation(
        action_id=ActionId("root"),
        points=0,
        previsionnel=10,
        potentiel=100,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_one_tache_is_pas_faite():
    action_statuses: List[ActionStatus] = [
        ActionStatus(action_id=ActionId("1.1"), avancement="pas_faite", concernee=True)
    ]
    actual_notation = compute_referentiel_notation.execute(action_statuses)

    assert len(actual_notation) == 4

    assert actual_notation[ActionId("1.1")] == ActionNotation(
        action_id=ActionId("1.1"),
        points=0,
        previsionnel=0,
        potentiel=10,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=True,
    )
    assert actual_notation[ActionId("1")] == ActionNotation(
        action_id=ActionId("1"),
        points=0,
        previsionnel=0,
        potentiel=30,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("2")] == ActionNotation(
        action_id=ActionId("2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("root")] == ActionNotation(
        action_id=ActionId("root"),
        points=0,
        previsionnel=0,
        potentiel=100,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_one_tache_non_concernee():
    action_statuses: List[ActionStatus] = [
        ActionStatus(
            action_id=ActionId("1.1"), avancement="non_renseignee", concernee=False
        )
    ]
    actual_notation = compute_referentiel_notation.execute(action_statuses)

    assert len(actual_notation) == 4

    assert actual_notation[ActionId("1.1")] == ActionNotation(
        action_id=ActionId("1.1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=False,
    )
    assert actual_notation[ActionId("1")] == ActionNotation(
        action_id=ActionId("1"),
        points=0,
        previsionnel=0,
        potentiel=20,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=False,
    )

    assert actual_notation[ActionId("2")] == ActionNotation(
        action_id=ActionId("2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("root")] == ActionNotation(
        action_id=ActionId("root"),
        points=0,
        previsionnel=0,
        potentiel=90,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_all_taches_of_a_sous_action_are_non_concernees():
    action_statuses: List[ActionStatus] = [
        ActionStatus(
            action_id=ActionId("1.1"), avancement="non_renseignee", concernee=False
        ),
        ActionStatus(
            action_id=ActionId("1.2"), avancement="non_renseignee", concernee=False
        ),
    ]
    actual_notation = compute_referentiel_notation.execute(action_statuses)

    assert len(actual_notation) == 5

    assert actual_notation[ActionId("1.1")] == ActionNotation(
        action_id=ActionId("1.1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=False,
    )
    assert actual_notation[ActionId("1.2")] == ActionNotation(
        action_id=ActionId("1.2"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=20,
        completude_ratio=(1, 1),
        concernee=False,
    )

    assert actual_notation[ActionId("1")] == ActionNotation(
        action_id=ActionId("1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=30,
        completude_ratio=(2, 2),
        concernee=False,
    )

    assert actual_notation[ActionId("2")] == ActionNotation(
        action_id=ActionId("2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert actual_notation[ActionId("root")] == ActionNotation(
        action_id=ActionId("root"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=100,
        completude_ratio=(2, 4),
        concernee=True,
    )
