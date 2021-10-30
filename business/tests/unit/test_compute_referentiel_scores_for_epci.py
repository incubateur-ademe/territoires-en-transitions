from typing import  List
from business.domain.models import events, commands

from business.domain.models.action_score import ActionScore
from business.domain.models.action_status import ActionStatus
from business.domain.ports.action_children_repo import InMemoryActionChildrenRepository
from business.domain.ports.action_points_repo import InMemoryActionPointsRepository
from business.domain.ports.action_status_repo import InMemoryActionStatusRepository
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.use_cases.compute_referentiel_scores_for_epci import (
    ComputeReferentielScoresForEpci,
)
from business.utils.action_id import ActionId
from business.domain.models.litterals import ReferentielId

from tests.utils.referentiel_factory import (
    make_action_children,
    make_action_points,
)
from tests.utils.spy_on_event import spy_on_event

test_referentiel_id: ReferentielId =  "eci"
action_childrens = [
    make_action_children(f"eci", ["eci_1", "eci_2"]),
    make_action_children(f"eci_1", ["eci_1.1", "eci_1.2"]),
    make_action_children(f"eci_2", ["eci_2.0", "eci_2.1"]),
]

action_points = [
    make_action_points(action_id=f"eci", points=100),
    make_action_points(action_id=f"eci_1", points=30),
    make_action_points(action_id=f"eci_2", points=70),
    make_action_points(action_id=f"eci_1.1", points=10),
    make_action_points(action_id=f"eci_1.2", points=20),
    make_action_points(action_id=f"eci_2.0", points=0),
    make_action_points(action_id=f"eci_2.1", points=70),
]
# eci_action = make_action_points(action_id="eci", points=100)
# action_1 = make_action_points(action_id="eci_1", points=30)
# action_2 = make_action_points(action_id="eci_2", points=70)
# tache_1_1 = make_action_points(action_id="eci_1.1", points=10)
# tache_1_2 = make_action_points(action_id="eci_1.2", points=20)
# tache_2_0 = make_action_points(action_id="2.0", points=0)
# tache_2_1 = make_action_points(action_id="2.1", points=70)
# eci_action.actions_ids = [ActionId("eci_1"), ActionId("eci_2")]
# action_1.actions_ids = [ActionId("eci_1.1"), ActionId("eci_1.2")]
# action_2.actions_ids = [tache_2_0.action_id, tache_2_1.action_id]


points_repo = InMemoryActionPointsRepository(action_points)
children_repo = InMemoryActionChildrenRepository(action_childrens)


def prepare_use_case(statuses: List[ActionStatus] ) -> List[events.ReferentielScoresForEpciComputed]:
    bus = InMemoryDomainMessageBus()
    statuses_repo = InMemoryActionStatusRepository(statuses)
    use_case = ComputeReferentielScoresForEpci(bus, 
        points_repo, children_repo, statuses_repo
    )
    score_computed_events = spy_on_event(bus,  events.ReferentielScoresForEpciComputed)
    
    command = commands.ComputeReferentielScoresForEpci(epci_id="foo", referentiel_id=test_referentiel_id)
    use_case.execute(command)

    return score_computed_events

def test_notation_when_one_tache_is_faite():
    statuses: List[ActionStatus] = [
        ActionStatus(action_id=ActionId("eci_1.1"), avancement="faite", concernee=True)
    ]
    converted_events = prepare_use_case(statuses)
    assert len(converted_events) == 1

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=10,
        previsionnel=10,
        potentiel=10,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=True,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=10,
        previsionnel=10,
        potentiel=30,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=10,
        previsionnel=10,
        potentiel=100,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_one_tache_is_programmee():
    statuses: List[ActionStatus] = [
        ActionStatus(action_id=ActionId("eci_1.1"), avancement="programmee", concernee=True)
    ]
    converted_events = prepare_use_case(statuses)
    assert len(converted_events) == 1

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}


    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=10,
        potentiel=10,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=True,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=10,
        potentiel=30,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=10,
        potentiel=100,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_one_tache_is_pas_faite():
    statuses: List[ActionStatus] = [
        ActionStatus(action_id=ActionId("eci_1.1"), avancement="pas_faite", concernee=True)
    ]
    converted_events = prepare_use_case(statuses)
    assert len(converted_events) == 1

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=0,
        potentiel=10,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=True,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=0,
        potentiel=30,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=0,
        potentiel=100,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_one_tache_non_concernee():
    statuses: List[ActionStatus] = [
        ActionStatus(
            action_id=ActionId("eci_1.1"), avancement="non_renseignee", concernee=False
        )
    ]
    converted_events = prepare_use_case(statuses)
    assert len(converted_events) == 1

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=False,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=0,
        potentiel=20,
        referentiel_points=30,
        completude_ratio=(1, 2),
        concernee=False,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=0,
        potentiel=90,
        referentiel_points=100,
        completude_ratio=(1, 4),
        concernee=True,
    )


def test_notation_when_all_taches_of_a_sous_action_are_non_concernees():
    statuses: List[ActionStatus] = [
        ActionStatus(
            action_id=ActionId("eci_1.1"), avancement="non_renseignee", concernee=False
        ),
        ActionStatus(
            action_id=ActionId("eci_1.2"), avancement="non_renseignee", concernee=False
        ),
    ]
    converted_events = prepare_use_case(statuses)
    assert len(converted_events) == 1

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 5

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=10,
        completude_ratio=(1, 1),
        concernee=False,
    )
    assert scores_by_id[ActionId("eci_1.2")] == ActionScore(
        action_id=ActionId("eci_1.2"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=20,
        completude_ratio=(1, 1),
        concernee=False,
    )

    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=30,
        completude_ratio=(2, 2),
        concernee=False,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completude_ratio=(0, 2),
        concernee=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=100,
        completude_ratio=(2, 4),
        concernee=True,
    )
