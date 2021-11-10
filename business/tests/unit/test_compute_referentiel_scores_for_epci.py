from typing import List, Optional, Tuple
from business.domain.models import events, commands

from business.domain.models.action_score import ActionScore
from business.domain.models.action_statut import ActionStatut, ActionStatutAvancement
from business.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
)
from business.domain.ports.action_status_repo import InMemoryActionStatutRepository
from business.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.domain.use_cases.compute_referentiel_scores_for_epci import (
    ComputeReferentielScoresForEpci,
)
from business.utils.action_id import ActionId
from business.domain.models.litterals import Referentiel

from tests.utils.referentiel_factory import (
    make_action_children,
    make_action_definition,
    make_action_points,
)
from tests.utils.spy_on_event import spy_on_event

test_referentiel = Referentiel = "eci"
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


referentiel_repo = InMemoryReferentielRepository()
referentiel_repo.add_referentiel(
    definitions=[
        make_action_definition(action_id)
        for action_id in [
            "eci",
            "eci_1",
            "eci_2",
            "eci_1.1",
            "eci_1.2",
            "eci_2.0",
            "eci_2.1",
        ]
    ],
    points=action_points,
    children=action_childrens,
)


def prepare_use_case(
    statuses: List[ActionStatut],
    command: Optional[commands.ComputeReferentielScoresForEpci] = None,
) -> Tuple[
    List[events.ReferentielScoresForEpciComputed],
    List[events.ReferentielScoresForEpciComputationFailed],
]:
    bus = InMemoryDomainMessageBus()
    statuses_repo = InMemoryActionStatutRepository(statuses)
    use_case = ComputeReferentielScoresForEpci(bus, referentiel_repo, statuses_repo)
    score_computed_events = spy_on_event(bus, events.ReferentielScoresForEpciComputed)
    failure_events = spy_on_event(bus, events.ReferentielScoresForEpciComputationFailed)
    command = command or commands.ComputeReferentielScoresForEpci(
        epci_id=1, referentiel=test_referentiel, created_at="2020-01-01T12"
    )
    use_case.execute(command)

    return score_computed_events, failure_events


def test_notation_fails_when_referentiel_is_empty():
    command = commands.ComputeReferentielScoresForEpci(
        epci_id=1, referentiel="cae", created_at="2020-01-01T12"
    )
    statuses = []
    converted_events, failure_events = prepare_use_case(statuses, command)
    assert len(converted_events) == 0
    assert len(failure_events) == 1


def test_notation_when_one_tache_is_fait():
    statuses: List[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            avancement=ActionStatutAvancement.FAIT,
            concerne=True,
        )
    ]
    converted_events, failure_events = prepare_use_case(statuses)
    assert len(converted_events) == 1
    assert len(failure_events) == 0

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=10,
        previsionnel=10,
        potentiel=10,
        referentiel_points=10,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=True,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=10,
        previsionnel=10,
        potentiel=30,
        referentiel_points=30,
        completed_taches_count=1,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completed_taches_count=0,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=10,
        previsionnel=10,
        potentiel=100,
        referentiel_points=100,
        completed_taches_count=1,
        total_taches_count=4,
        concerne=True,
    )


def test_notation_when_one_tache_is_programmee():
    statuses: List[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            avancement=ActionStatutAvancement.PROGRAMME,
            concerne=True,
        )
    ]
    converted_events, failure_events = prepare_use_case(statuses)
    assert len(converted_events) == 1
    assert len(failure_events) == 0

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=10,
        potentiel=10,
        referentiel_points=10,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=True,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=10,
        potentiel=30,
        referentiel_points=30,
        completed_taches_count=1,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completed_taches_count=0,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=10,
        potentiel=100,
        referentiel_points=100,
        completed_taches_count=1,
        total_taches_count=4,
        concerne=True,
    )


def test_notation_when_one_tache_is_pas_fait():
    statuses: List[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            avancement=ActionStatutAvancement.PAS_FAIT,
            concerne=True,
        )
    ]
    converted_events, failure_events = prepare_use_case(statuses)
    assert len(converted_events) == 1
    assert len(failure_events) == 0

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=0,
        potentiel=10,
        referentiel_points=10,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=True,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=0,
        potentiel=30,
        referentiel_points=30,
        completed_taches_count=1,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completed_taches_count=0,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=0,
        potentiel=100,
        referentiel_points=100,
        completed_taches_count=1,
        total_taches_count=4,
        concerne=True,
    )


def test_notation_when_one_tache_non_concerne():
    statuses: List[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            avancement=ActionStatutAvancement.NON_RENSEIGNE,
            concerne=False,
        )
    ]
    converted_events, failure_events = prepare_use_case(statuses)
    assert len(converted_events) == 1
    assert len(failure_events) == 0

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 4

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=10,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=False,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=0,
        potentiel=20,
        referentiel_points=30,
        completed_taches_count=1,
        total_taches_count=2,
        concerne=False,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completed_taches_count=0,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=0,
        potentiel=90,
        referentiel_points=100,
        completed_taches_count=1,
        total_taches_count=4,
        concerne=True,
    )


def test_notation_when_all_taches_of_a_sous_action_are_non_concernes():
    statuses: List[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            avancement=ActionStatutAvancement.NON_RENSEIGNE,
            concerne=False,
        ),
        ActionStatut(
            action_id=ActionId("eci_1.2"),
            avancement=ActionStatutAvancement.NON_RENSEIGNE,
            concerne=False,
        ),
    ]
    converted_events, failure_events = prepare_use_case(statuses)
    assert len(converted_events) == 1
    assert len(failure_events) == 0

    actual_scores = converted_events[0].scores
    assert len(actual_scores) == 5

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=10,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=False,
    )
    assert scores_by_id[ActionId("eci_1.2")] == ActionScore(
        action_id=ActionId("eci_1.2"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=20,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=False,
    )

    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        points=0,
        previsionnel=0,
        potentiel=0,
        referentiel_points=30,
        completed_taches_count=2,
        total_taches_count=2,
        concerne=False,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=70,
        completed_taches_count=0,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        points=0,
        previsionnel=0,
        potentiel=70,
        referentiel_points=100,
        completed_taches_count=2,
        total_taches_count=4,
        concerne=True,
    )
