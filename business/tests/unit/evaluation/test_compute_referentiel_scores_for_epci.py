from typing import List, Optional, Tuple
import copy

from business.evaluation.domain.models import events

from business.evaluation.domain.models.action_score import ActionScore
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
    ActionStatutAvancement,
)
from business.referentiel.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
)
from business.evaluation.domain.ports.action_status_repo import (
    InMemoryActionStatutRepository,
)
from business.core.domain.ports.domain_message_bus import InMemoryDomainMessageBus
from business.evaluation.domain.use_cases.compute_referentiel_scores_for_collectivite import (
    ComputeReferentielScoresForCollectivite,
)
from business.utils.action_id import ActionId

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
    make_action_children(f"eci_2", ["eci_2.0", "eci_2.1", "eci_2.2"]),
]

action_points = [
    make_action_points(action_id=f"eci", points=100),
    make_action_points(action_id=f"eci_1", points=30),
    make_action_points(action_id=f"eci_2", points=70),
    make_action_points(action_id=f"eci_1.1", points=10),
    make_action_points(action_id=f"eci_1.2", points=20),
    make_action_points(action_id=f"eci_2.0", points=0),
    make_action_points(action_id=f"eci_2.1", points=65),
    make_action_points(action_id=f"eci_2.2", points=5),
]


referentiel_repo = InMemoryReferentielRepository()
referentiel_repo.add_referentiel_actions(
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
            "eci_2.2",
        ]
    ],
    points=action_points,
    children=action_childrens,
)


def prepare_use_case(
    statuses: List[ActionStatut],
    trigger: Optional[events.ActionStatutUpdatedForCollectivite] = None,
    referentiel_repo: InMemoryReferentielRepository = referentiel_repo,
) -> Tuple[
    List[events.ReferentielScoresForCollectiviteComputed],
    List[events.ReferentielScoresForCollectiviteComputationFailed],
]:
    bus = InMemoryDomainMessageBus()
    statuses_repo = InMemoryActionStatutRepository(statuses)
    use_case = ComputeReferentielScoresForCollectivite(
        bus,
        referentiel_repo,
        statuses_repo,
        referentiel_action_level={"eci": 1, "cae": 2},
    )
    score_computed_events = spy_on_event(
        bus, events.ReferentielScoresForCollectiviteComputed
    )
    failure_events = spy_on_event(
        bus, events.ReferentielScoresForCollectiviteComputationFailed
    )
    trigger = trigger or events.ActionStatutUpdatedForCollectivite(
        collectivite_id=1,
        referentiel=test_referentiel,
        created_at="2020-01-01T12",
        id=0,
    )
    use_case.execute(trigger)

    return score_computed_events, failure_events


def test_notation_fails_when_referentiel_is_empty():
    trigger = events.ActionStatutUpdatedForCollectivite(
        collectivite_id=1, referentiel="cae", created_at="2020-01-01T12", id=0
    )
    statuses = []
    converted_events, failure_events = prepare_use_case(statuses, trigger)
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
    assert len(actual_scores) == 8

    scores_by_id = {score.action_id: score for score in actual_scores}

    assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=10,
        point_programme=0,
        point_pas_fait=0,
        point_potentiel=10,
        point_non_renseigne=0,
        point_referentiel=10,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=True,
    )
    assert scores_by_id[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=10,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=20,
        point_potentiel=30,
        point_referentiel=30,
        completed_taches_count=1,
        total_taches_count=2,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=70,
        point_potentiel=70,
        point_referentiel=70,
        completed_taches_count=0,
        total_taches_count=3,
        concerne=True,
    )

    assert scores_by_id[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=10,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=90,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=1,
        total_taches_count=5,
        concerne=True,
    )


# def test_notation_when_one_tache_is_programmee():
#     statuses: List[ActionStatut] = [
#         ActionStatut(
#             action_id=ActionId("eci_1.1"),
#             avancement=ActionStatutAvancement.PROGRAMME,
#             concerne=True,
#         )
#     ]
#     converted_events, failure_events = prepare_use_case(statuses)
#     assert len(converted_events) == 1
#     assert len(failure_events) == 0

#     actual_scores = converted_events[0].scores
#     assert len(actual_scores) == 8

#     scores_by_id = {score.action_id: score for score in actual_scores}

#     assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
#         action_id=ActionId("eci_1.1"),
#         point_fait=0,
#         previsionnel=10,
#         potentiel=10,
#         referentiel_points=10,
#         completed_taches_count=1,
#         total_taches_count=1,
#         concerne=True,
#     )
#     assert scores_by_id[ActionId("eci_1")] == ActionScore(
#         action_id=ActionId("eci_1"),
#         point_fait=0,
#         previsionnel=10,
#         potentiel=30,
#         referentiel_points=30,
#         completed_taches_count=1,
#         total_taches_count=2,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci_2")] == ActionScore(
#         action_id=ActionId("eci_2"),
#         point_fait=None,
#         previsionnel=None,
#         potentiel=70,
#         referentiel_points=70,
#         completed_taches_count=0,
#         total_taches_count=3,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci")] == ActionScore(
#         action_id=ActionId("eci"),
#         point_fait=0,
#         previsionnel=10,
#         potentiel=100,
#         referentiel_points=100,
#         completed_taches_count=1,
#         total_taches_count=5,
#         concerne=True,
#     )


# def test_notation_when_one_tache_is_pas_fait():
#     statuses: List[ActionStatut] = [
#         ActionStatut(
#             action_id=ActionId("eci_1.1"),
#             avancement=ActionStatutAvancement.PAS_FAIT,
#             concerne=True,
#         )
#     ]
#     converted_events, failure_events = prepare_use_case(statuses)
#     assert len(converted_events) == 1
#     assert len(failure_events) == 0

#     actual_scores = converted_events[0].scores
#     assert len(actual_scores) == 8

#     scores_by_id = {score.action_id: score for score in actual_scores}

#     assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
#         action_id=ActionId("eci_1.1"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=10,
#         referentiel_points=10,
#         completed_taches_count=1,
#         total_taches_count=1,
#         concerne=True,
#     )
#     assert scores_by_id[ActionId("eci_1")] == ActionScore(
#         action_id=ActionId("eci_1"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=30,
#         referentiel_points=30,
#         completed_taches_count=1,
#         total_taches_count=2,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci_2")] == ActionScore(
#         action_id=ActionId("eci_2"),
#         point_fait=None,
#         previsionnel=None,
#         potentiel=70,
#         referentiel_points=70,
#         completed_taches_count=0,
#         total_taches_count=3,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci")] == ActionScore(
#         action_id=ActionId("eci"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=100,
#         referentiel_points=100,
#         completed_taches_count=1,
#         total_taches_count=5,
#         concerne=True,
#     )


# def test_notation_when_one_tache_is_non_concerne():
#     statuses: List[ActionStatut] = [
#         ActionStatut(
#             action_id=ActionId("eci_1.1"),
#             avancement=ActionStatutAvancement.NON_RENSEIGNE,
#             concerne=False,
#         )
#     ]
#     converted_events, failure_events = prepare_use_case(statuses)
#     assert len(converted_events) == 1
#     assert len(failure_events) == 0

#     actual_scores = converted_events[0].scores
#     assert len(actual_scores) == 8

#     scores_by_id = {score.action_id: score for score in actual_scores}

#     assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
#         action_id=ActionId("eci_1.1"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=0,
#         referentiel_points=10,
#         completed_taches_count=1,
#         total_taches_count=1,
#         concerne=False,
#     )
#     # point_fait of eci_1.1 is redistributed to its siblings (ie. to eci_1.2)
#     assert scores_by_id[ActionId("eci_1.2")] == ActionScore(
#         action_id=ActionId("eci_1.2"),
#         point_fait=None,
#         previsionnel=None,
#         potentiel=30,
#         referentiel_points=20,
#         completed_taches_count=0,
#         total_taches_count=1,
#         concerne=True,
#     )
#     assert scores_by_id[ActionId("eci_1")] == ActionScore(
#         action_id=ActionId("eci_1"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=30,
#         referentiel_points=30,
#         completed_taches_count=1,
#         total_taches_count=2,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci_2")] == ActionScore(
#         action_id=ActionId("eci_2"),
#         point_fait=None,
#         previsionnel=None,
#         potentiel=70,
#         referentiel_points=70,
#         completed_taches_count=0,
#         total_taches_count=3,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci")] == ActionScore(
#         action_id=ActionId("eci"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=100,
#         referentiel_points=100,
#         completed_taches_count=1,
#         total_taches_count=5,
#         concerne=True,
#     )


# def test_notation_when_an_action__of_action_level_becomes_non_concernee():
#     statuses: List[ActionStatut] = [
#         ActionStatut(
#             action_id=ActionId("eci_1.1"),
#             avancement=ActionStatutAvancement.NON_RENSEIGNE,
#             concerne=False,
#         ),
#         ActionStatut(
#             action_id=ActionId("eci_1.2"),
#             avancement=ActionStatutAvancement.NON_RENSEIGNE,
#             concerne=False,
#         ),
#     ]
#     converted_events, failure_events = prepare_use_case(statuses)
#     assert len(converted_events) == 1
#     assert len(failure_events) == 0

#     actual_scores = converted_events[0].scores
#     assert len(actual_scores) == 8

#     scores_by_id = {score.action_id: score for score in actual_scores}

#     assert scores_by_id[ActionId("eci_1.1")] == ActionScore(
#         action_id=ActionId("eci_1.1"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=0,
#         referentiel_points=10,
#         completed_taches_count=1,
#         total_taches_count=1,
#         concerne=False,
#     )
#     assert scores_by_id[ActionId("eci_1.2")] == ActionScore(
#         action_id=ActionId("eci_1.2"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=0,
#         referentiel_points=20,
#         completed_taches_count=1,
#         total_taches_count=1,
#         concerne=False,
#     )

#     assert scores_by_id[ActionId("eci_1")] == ActionScore(
#         action_id=ActionId("eci_1"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=0,
#         referentiel_points=30,
#         completed_taches_count=2,
#         total_taches_count=2,
#         concerne=False,
#     )

#     assert scores_by_id[ActionId("eci_2")] == ActionScore(
#         action_id=ActionId("eci_2"),
#         point_fait=None,
#         previsionnel=None,
#         potentiel=70,
#         referentiel_points=70,
#         completed_taches_count=0,
#         total_taches_count=3,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci")] == ActionScore(
#         action_id=ActionId("eci"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=70,
#         referentiel_points=100,
#         completed_taches_count=2,
#         total_taches_count=5,
#         concerne=True,
#     )


# def test_notation_should_not_redistribute_points_on_taches_regementaires():
#     statuses: List[ActionStatut] = [
#         ActionStatut(
#             action_id=ActionId("eci_2.1"),
#             avancement=ActionStatutAvancement.NON_RENSEIGNE,
#             concerne=False,
#         ),
#         ActionStatut(
#             action_id=ActionId("eci_2.2"),
#             avancement=ActionStatutAvancement.FAIT,
#             concerne=True,
#         ),
#     ]
#     converted_events, failure_events = prepare_use_case(statuses)
#     assert len(converted_events) == 1
#     assert len(failure_events) == 0

#     actual_scores = converted_events[0].scores
#     assert len(actual_scores) == 8

#     scores_by_id = {score.action_id: score for score in actual_scores}

#     assert scores_by_id[ActionId("eci_2.0")] == ActionScore(
#         action_id=ActionId("eci_2.0"),
#         point_fait=None,
#         previsionnel=None,
#         potentiel=0,
#         referentiel_points=0,
#         completed_taches_count=0,
#         total_taches_count=1,
#         concerne=True,
#     )
#     assert scores_by_id[ActionId("eci_2.1")] == ActionScore(
#         action_id=ActionId("eci_2.1"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=0,
#         referentiel_points=65,
#         completed_taches_count=1,
#         total_taches_count=1,
#         concerne=False,
#     )

#     assert scores_by_id[ActionId("eci_2.2")] == ActionScore(
#         action_id=ActionId("eci_2.2"),
#         point_fait=70,
#         previsionnel=70,
#         potentiel=70,
#         referentiel_points=5,
#         completed_taches_count=1,
#         total_taches_count=1,
#         concerne=True,
#     )
#     assert scores_by_id[ActionId("eci_2")] == ActionScore(
#         action_id=ActionId("eci_2"),
#         point_fait=70,
#         previsionnel=70,
#         potentiel=70,
#         referentiel_points=70,
#         completed_taches_count=2,
#         total_taches_count=3,
#         concerne=True,
#     )

#     assert scores_by_id[ActionId("eci")] == ActionScore(
#         action_id=ActionId("eci"),
#         point_fait=70,
#         previsionnel=70,
#         potentiel=100,
#         referentiel_points=100,
#         completed_taches_count=2,
#         total_taches_count=5,
#         concerne=True,
#     )


# deeper_referentiel = copy.deepcopy(referentiel_repo)
# action_childrens = [
#     make_action_children(f"eci_2.2", ["eci_2.2.1", "eci_2.2.2", "eci_2.2.3"]),
# ]

# action_points = [
#     make_action_points(action_id=f"eci_2.2.1", point_fait=2),
#     make_action_points(action_id=f"eci_2.2.2", point_fait=1.5),
#     make_action_points(action_id=f"eci_2.2.3", point_fait=1.5),
# ]

# deeper_referentiel.add_referentiel_actions(
#     definitions=[
#         make_action_definition(action_id)
#         for action_id in [
#             "eci_2.2.1",
#             "eci_2.2.2",
#             "eci_2.2.3",
#         ]
#     ],
#     point_fait=action_points,
#     children=action_childrens,
# )


# def test_notation_should_redistribute_non_concernee_points_if_level_is_greater_than_action_level():

#     statuses: List[ActionStatut] = [
#         ActionStatut(
#             action_id=ActionId("eci_2.2.1"),
#             avancement=ActionStatutAvancement.NON_RENSEIGNE,
#             concerne=False,
#         ),
#         ActionStatut(
#             action_id=ActionId("eci_2.2.2"),
#             avancement=ActionStatutAvancement.NON_RENSEIGNE,
#             concerne=False,
#         ),
#         ActionStatut(
#             action_id=ActionId("eci_2.2.3"),
#             avancement=ActionStatutAvancement.NON_RENSEIGNE,
#             concerne=False,
#         ),
#         ActionStatut(
#             action_id=ActionId("eci_1.1"),
#             avancement=ActionStatutAvancement.PROGRAMME,
#             concerne=True,
#         ),
#     ]
#     converted_events, failure_events = prepare_use_case(
#         statuses, referentiel_repo=deeper_referentiel
#     )
#     assert len(converted_events) == 1
#     assert len(failure_events) == 0

#     actual_scores = converted_events[0].scores
#     assert len(actual_scores) == 11

#     scores_by_id = {score.action_id: score for score in actual_scores}

#     assert scores_by_id[ActionId("eci_2.2")] == ActionScore(
#         action_id=ActionId("eci_2.2"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=0,
#         referentiel_points=5,
#         completed_taches_count=3,
#         total_taches_count=3,
#         concerne=False,
#     )
#     # point_fait of 2.2 is redistributed on 2.1
#     assert scores_by_id[ActionId("eci_2.1")] == ActionScore(
#         action_id=ActionId("eci_2.1"),
#         point_fait=None,
#         previsionnel=None,
#         potentiel=70,
#         referentiel_points=65,
#         completed_taches_count=0,
#         total_taches_count=1,
#         concerne=True,
#     )

#     # axe 2 point_fait should remain unchanged
#     assert scores_by_id[ActionId("eci_2")] == ActionScore(
#         action_id=ActionId("eci_2"),
#         point_fait=0,
#         previsionnel=0,
#         potentiel=70,
#         referentiel_points=70,
#         completed_taches_count=3,
#         total_taches_count=5,
#         concerne=True,
#     )

#     # root point_fait should remain unchanged
#     assert scores_by_id[ActionId("eci")] == ActionScore(
#         action_id=ActionId("eci"),
#         point_fait=0,
#         previsionnel=10,
#         potentiel=100,
#         referentiel_points=100,
#         completed_taches_count=4,
#         total_taches_count=7,
#         concerne=True,
#     )


# def test_notation_should_lower_root_potential_if_level_is_smaller_than_action_level():
#     referentiel_repo
