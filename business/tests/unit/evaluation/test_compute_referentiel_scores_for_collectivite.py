import math
import pytest

from business.utils.models.action_score import ActionScore
from business.utils.models.action_statut import (
    ActionStatut,
    DetailedAvancement,
)
from business.evaluation.evaluation.action_point_tree import (
    ActionPointTree,
)
from business.evaluation.evaluation.compute_scores import (
    compute_scores,
)
from business.utils.models.actions import ActionId
from business.utils.models.personnalisation import ActionPersonnalisationConsequence
from tests.utils.referentiel_factory import (
    make_action_children,
    make_action_points,
)


@pytest.fixture
def simple_point_tree_referentiel() -> ActionPointTree:
    return ActionPointTree(
        [
            make_action_points(action_id="eci", points=100),
            make_action_points(action_id="eci_1", points=30),
            make_action_points(action_id="eci_2", points=70),
            make_action_points(action_id="eci_1.1", points=10),
            make_action_points(action_id="eci_1.2", points=20),
            make_action_points(action_id="eci_2.0", points=0),
            make_action_points(action_id="eci_2.1", points=65),
            make_action_points(action_id="eci_2.2", points=5),
        ],
        [
            make_action_children("eci", ["eci_1", "eci_2"]),
            make_action_children("eci_1", ["eci_1.1", "eci_1.2"]),
            make_action_children("eci_2", ["eci_2.0", "eci_2.1", "eci_2.2"]),
        ],
    )


@pytest.fixture
def deeper_point_tree_deeper_referentiel() -> ActionPointTree:
    return ActionPointTree(
        [
            make_action_points(action_id="eci", points=100),
            make_action_points(action_id="eci_1", points=30),
            make_action_points(action_id="eci_2", points=70),
            make_action_points(action_id="eci_1.1", points=10),
            make_action_points(action_id="eci_1.2", points=20),
            make_action_points(action_id="eci_2.0", points=0),
            make_action_points(action_id="eci_2.1", points=65),
            make_action_points(action_id="eci_2.2", points=5),
            make_action_points(action_id="eci_2.2.1", points=2),
            make_action_points(action_id="eci_2.2.2", points=1.5),
            make_action_points(action_id="eci_2.2.3", points=1.5),
            make_action_points(action_id="eci_2.1.0", points=0),
            make_action_points(action_id="eci_2.1.1", points=40),
            make_action_points(action_id="eci_2.1.2", points=25),
        ],
        [
            make_action_children("eci", ["eci_1", "eci_2"]),
            make_action_children("eci_1", ["eci_1.1", "eci_1.2"]),
            make_action_children("eci_2", ["eci_2.0", "eci_2.1", "eci_2.2"]),
            make_action_children("eci_2.2", ["eci_2.2.1", "eci_2.2.2", "eci_2.2.3"]),
            make_action_children("eci_2.1", ["eci_2.1.0", "eci_2.1.1", "eci_2.1.2"]),
        ],
    )


def test_notation_when_one_tache_is_fait(simple_point_tree_referentiel):
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(1, 0, 0),
            concerne=True,
        )
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel,
        statuses,
        personnalisation_consequences={},
        action_level=1,
    )

    assert len(actual_scores) == 8
    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=10,
        point_programme=0,
        point_pas_fait=0,
        point_potentiel=10,
        point_non_renseigne=0,
        point_referentiel=10,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=10,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=20,
        point_potentiel=30,
        point_referentiel=30,
        completed_taches_count=1,
        total_taches_count=2,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=70,
        point_potentiel=70,
        point_referentiel=70,
        completed_taches_count=0,
        total_taches_count=3,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=10,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=90,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=1,
        total_taches_count=5,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_when_one_tache_is_programme(simple_point_tree_referentiel):
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(0, 1, 0),
            concerne=True,
        )
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel,
        statuses,
        personnalisation_consequences={},
        action_level=1,
    )
    assert len(actual_scores) == 8

    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=0,
        point_programme=10,
        point_pas_fait=0,
        point_potentiel=10,
        point_non_renseigne=0,
        point_referentiel=10,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=1,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=0,
        point_programme=10,
        point_pas_fait=0,
        point_non_renseigne=20,
        point_potentiel=30,
        point_referentiel=30,
        completed_taches_count=1,
        total_taches_count=2,
        fait_taches_avancement=0,
        programme_taches_avancement=1,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=0,
        point_programme=10,
        point_pas_fait=0,
        point_non_renseigne=90,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=1,
        total_taches_count=5,
        fait_taches_avancement=0,
        programme_taches_avancement=1,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_when_one_tache_is_pas_fait(simple_point_tree_referentiel):
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(0, 0, 1),
            concerne=True,
        )
    ]

    actual_scores = compute_scores(
        simple_point_tree_referentiel,
        statuses,
        personnalisation_consequences={},
        action_level=1,
    )
    assert len(actual_scores) == 8

    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=10,
        point_potentiel=10,
        point_non_renseigne=0,
        point_referentiel=10,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=1,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=10,
        point_non_renseigne=20,
        point_potentiel=30,
        point_referentiel=30,
        completed_taches_count=1,
        total_taches_count=2,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=1,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=10,
        point_non_renseigne=90,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=1,
        total_taches_count=5,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=1,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_when_one_tache_has_detailed_avancement(simple_point_tree_referentiel):
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(0.2, 0.7, 0.1),
            concerne=True,
        )
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel,
        statuses,
        personnalisation_consequences={},
        action_level=1,
    )
    assert len(actual_scores) == 8

    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=2,
        point_programme=7,
        point_pas_fait=1,
        point_potentiel=10,
        point_non_renseigne=0,
        point_referentiel=10,
        completed_taches_count=1,
        total_taches_count=1,
        concerne=True,
        fait_taches_avancement=0.2,
        programme_taches_avancement=0.7,
        pas_fait_taches_avancement=0.1,
        pas_concerne_taches_avancement=0,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=2,
        point_programme=7,
        point_pas_fait=1,
        point_non_renseigne=20,
        point_potentiel=30,
        point_referentiel=30,
        completed_taches_count=1,
        total_taches_count=2,
        fait_taches_avancement=0.2,
        programme_taches_avancement=0.7,
        pas_fait_taches_avancement=0.1,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=2,
        point_programme=7,
        point_pas_fait=1,
        point_non_renseigne=90,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=1,
        total_taches_count=5,
        fait_taches_avancement=0.2,
        programme_taches_avancement=0.7,
        pas_fait_taches_avancement=0.1,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_when_one_tache_is_non_concerne(simple_point_tree_referentiel):
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=None,
            concerne=False,
        )
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel,
        statuses,
        personnalisation_consequences={},
        action_level=1,
    )
    assert len(actual_scores) == 8

    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_potentiel=0,
        point_non_renseigne=0,
        point_referentiel=10,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=False,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci_1.2")] == ActionScore(
        action_id=ActionId("eci_1.2"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_potentiel=30,
        point_non_renseigne=30,
        point_referentiel=20,
        completed_taches_count=0,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=30,
        point_potentiel=30,
        point_referentiel=30,
        completed_taches_count=1,
        total_taches_count=2,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=100,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=1,
        total_taches_count=5,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_when_an_action_of_action_level_becomes_non_concernee(
    simple_point_tree_referentiel,
):
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=None,
            concerne=False,
        ),
        ActionStatut(
            action_id=ActionId("eci_1.2"),
            detailed_avancement=None,
            concerne=False,
        ),
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel,
        statuses,
        personnalisation_consequences={},
        action_level=1,
    )

    assert len(actual_scores) == 8

    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=0,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=0,
        point_potentiel=0,
        point_referentiel=10,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=False,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_1.2")] == ActionScore(
        action_id=ActionId("eci_1.2"),
        point_fait=0,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=0,
        point_potentiel=0,
        point_referentiel=20,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=False,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=0,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=0,
        point_potentiel=0,
        point_referentiel=30,
        completed_taches_count=2,
        total_taches_count=2,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=2,
        concerne=False,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        point_fait=0,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=70,
        point_potentiel=70,
        point_referentiel=70,
        completed_taches_count=0,
        total_taches_count=3,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=70,
        point_potentiel=70,
        point_referentiel=100,
        completed_taches_count=2,
        total_taches_count=5,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=2,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_should_not_redistribute_points_on_taches_regementaires(
    simple_point_tree_referentiel,
):
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_2.1"),
            detailed_avancement=None,
            concerne=False,
        ),
        ActionStatut(
            action_id=ActionId("eci_2.2"),
            detailed_avancement=DetailedAvancement(1, 0, 0),
            concerne=True,
        ),
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel, statuses, {}, action_level=1
    )
    assert len(actual_scores) == 8

    assert actual_scores[ActionId("eci_2.0")] == ActionScore(
        action_id=ActionId("eci_2.0"),
        point_fait=0,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=0,
        point_potentiel=0,
        point_referentiel=0,
        completed_taches_count=0,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_2.1")] == ActionScore(
        action_id=ActionId("eci_2.1"),
        point_fait=0,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=0,
        point_potentiel=0,
        point_referentiel=65,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=False,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci_2.2")] == ActionScore(
        action_id=ActionId("eci_2.2"),
        point_fait=70,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=0,
        point_potentiel=70,
        point_referentiel=5,
        completed_taches_count=1,
        total_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        point_fait=70,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=0,
        point_potentiel=70,
        point_referentiel=70,
        completed_taches_count=2,
        total_taches_count=3,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=70,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=30,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=2,
        total_taches_count=5,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=1,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_should_redistribute_non_concernee_points_if_depth_is_greater_than_action_depth(
    deeper_point_tree_deeper_referentiel,
):

    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_2.2.1"),
            detailed_avancement=None,
            concerne=False,
        ),
        ActionStatut(
            action_id=ActionId("eci_2.2.2"),
            detailed_avancement=None,
            concerne=False,
        ),
        ActionStatut(
            action_id=ActionId("eci_2.2.3"),
            detailed_avancement=None,
            concerne=False,
        ),
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(0, 1, 0),
            concerne=True,
        ),
    ]
    actual_scores = compute_scores(
        deeper_point_tree_deeper_referentiel, statuses, {}, action_level=1
    )
    assert len(actual_scores) == 14

    assert actual_scores[ActionId("eci_2.2")] == ActionScore(
        action_id=ActionId("eci_2.2"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=0,
        point_potentiel=0,
        point_referentiel=5,
        completed_taches_count=3,
        total_taches_count=3,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=3,
        concerne=False,
        point_potentiel_perso=None,
        desactive=False,
    )
    # point_fait of 2.2 is redistributed on 2.1
    assert actual_scores[ActionId("eci_2.1")] == ActionScore(
        action_id=ActionId("eci_2.1"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=70,
        point_potentiel=70,
        point_referentiel=65,
        completed_taches_count=0,
        total_taches_count=3,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    assert actual_scores[ActionId("eci_2.1.0")] == ActionScore(
        action_id=ActionId("eci_2.1.0"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=0,
        point_potentiel=0,
        point_referentiel=0,
        completed_taches_count=0,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_2.1.1")] == ActionScore(
        action_id=ActionId("eci_2.1.1"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=round(40 / 65 * 70, 3),
        point_potentiel=round(40 / 65 * 70, 3),
        point_referentiel=40,
        completed_taches_count=0,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    assert actual_scores[ActionId("eci_2.1.2")] == ActionScore(
        action_id=ActionId("eci_2.1.2"),
        point_fait=0,
        point_programme=0,
        point_pas_fait=0,
        point_non_renseigne=round(25 / 65 * 70, 3),
        point_potentiel=round(25 / 65 * 70, 3),
        point_referentiel=25,
        completed_taches_count=0,
        total_taches_count=1,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )
    # axe 2 point_fait should remain unchanged
    assert actual_scores[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        point_fait=0,
        point_pas_fait=0,
        point_programme=0,
        point_non_renseigne=70,
        point_potentiel=70,
        point_referentiel=70,
        completed_taches_count=3,
        total_taches_count=7,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=3,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )

    # root point_fait should remain unchanged
    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=0,
        point_programme=10,
        point_pas_fait=0,
        point_non_renseigne=90,
        point_potentiel=100,
        point_referentiel=100,
        completed_taches_count=4,
        total_taches_count=9,
        fait_taches_avancement=0,
        programme_taches_avancement=1,  # tache 1.1 a un avencement de (0, 1, 0)
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=3,
        concerne=True,
        point_potentiel_perso=None,
        desactive=False,
    )


def test_notation_when_one_action_is_desactivee(simple_point_tree_referentiel):
    consequences = {
        ActionId("eci_1"): ActionPersonnalisationConsequence(desactive=True)
    }
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_2.2"),
            detailed_avancement=DetailedAvancement(1, 0, 0),
            concerne=True,
        )
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel, statuses, consequences, action_level=1
    )

    # Only action eci_1 should de desactive and potentiel reduced to 0
    assert actual_scores[ActionId("eci_1")].desactive == True
    assert actual_scores[ActionId("eci_1")].point_potentiel_perso == None
    # Point potentiel is impacted by desactivation
    assert actual_scores[ActionId("eci_1")].point_potentiel == 0
    # Point referentiel is not impacted by desactivation
    assert actual_scores[ActionId("eci_1")].point_referentiel == 30

    # Consequences on action children should affect point_potentiel (reduced to 0) but not point_potentiel_perso that is None
    assert (
        actual_scores[ActionId("eci_1.1")].desactive
        == actual_scores[ActionId("eci_1.2")].desactive
        == True
    )
    assert (
        actual_scores[ActionId("eci_1.1")].point_potentiel
        == actual_scores[ActionId("eci_1.2")].point_potentiel
        == 0
    )
    assert (
        actual_scores[ActionId("eci_1.1")].point_potentiel_perso
        == actual_scores[ActionId("eci_1.1")].point_potentiel_perso
        == None
    )

    assert actual_scores[ActionId("eci_1.1")].point_referentiel == 10
    assert actual_scores[ActionId("eci_1.2")].point_referentiel == 20

    # Consequences should also affect action parent potentiel points
    assert actual_scores[ActionId("eci")].point_potentiel == 70
    # Consequences should not affect parent point referentiel, desactive and point_potentiel_perso
    assert actual_scores[ActionId("eci")].desactive == False
    assert actual_scores[ActionId("eci")].point_potentiel_perso == None
    assert actual_scores[ActionId("eci")].point_referentiel == 100

    # Check scores are still calculated correctly
    assert (
        actual_scores[ActionId("eci")].point_fait
        == actual_scores[ActionId("eci_2.2")].point_fait
        == 5
    )


def test_notation_when_one_action_is_reduced(simple_point_tree_referentiel):
    consequences = {
        ActionId("eci_1"): ActionPersonnalisationConsequence(
            potentiel_perso=0.2
        )  # Action eci_1 officially worse 30 points, so will be reduced to 6 points
    }
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(1, 0, 0),
            concerne=True,
        )
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel, statuses, consequences, action_level=1
    )

    # Actions eci_1.1 and eci_1.2 should also have been reduced with a factor of 0.2
    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=2.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=0.0,
        point_potentiel=2.0,
        point_referentiel=10,
        concerne=True,
        total_taches_count=1,
        completed_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=None,  # None because the consequence is derived from the parent
    )
    assert actual_scores[ActionId("eci_1.2")] == ActionScore(
        action_id=ActionId("eci_1.2"),
        point_fait=0.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=4.0,
        point_potentiel=4.0,
        point_referentiel=20,
        concerne=True,
        total_taches_count=1,
        completed_taches_count=0,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=None,  # None because the consequence is derived from the parent
    )

    # Action eci_1 should be reduced to 6 points
    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=2.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=4.0,
        point_potentiel=6.0,
        point_referentiel=30,
        concerne=True,
        total_taches_count=2,
        completed_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=6.0,
    )
    # Root action eci should be reduced to 76 points (6 points from eci_1 and 70 points from eci_2)
    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=2.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=74.0,
        point_potentiel=76.0,
        point_referentiel=100,
        concerne=True,
        total_taches_count=5,
        completed_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=None,
    )


def test_notation_when_one_action_is_increased(simple_point_tree_referentiel):
    consequences = {
        ActionId("eci_1"): ActionPersonnalisationConsequence(
            potentiel_perso=1.2
        )  # Action eci_1 officially worse 30 points, so will be increased to 36 points
    }
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(1, 0, 0),
            concerne=True,
        )
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel, statuses, consequences, action_level=1
    )

    # Actions eci_1.1 and eci_1.2 should also have been increased with a factor of 1.2
    assert actual_scores[ActionId("eci_1.1")] == ActionScore(
        action_id=ActionId("eci_1.1"),
        point_fait=12.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=0.0,
        point_potentiel=12.0,  # (10 * 1.2)
        point_referentiel=10,
        concerne=True,
        total_taches_count=1,
        completed_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=None,  # None because the consequence is derived from the parent
    )
    assert actual_scores[ActionId("eci_1.2")] == ActionScore(
        action_id=ActionId("eci_1.2"),
        point_fait=0.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=24.0,
        point_potentiel=24.0,  # (20 * 1.2)
        point_referentiel=20,
        concerne=True,
        total_taches_count=1,
        completed_taches_count=0,
        fait_taches_avancement=0,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=None,  # None because the consequence is derived from the parent
    )

    # Action eci_1 should be reduced to 6 points
    assert actual_scores[ActionId("eci_1")] == ActionScore(
        action_id=ActionId("eci_1"),
        point_fait=12.0,  # From eci_1.1
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=24.0,  # From eci_1.2
        point_potentiel=36.0,  # (30 * 1.2)
        point_referentiel=30,
        concerne=True,
        total_taches_count=2,
        completed_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=36.0,  # Consequence applied here ! (30 * 1.2)
    )
    # Root action eci should be reduced to 76 points (6 points from eci_1 and 70 points from eci_2)
    assert actual_scores[ActionId("eci")] == ActionScore(
        action_id=ActionId("eci"),
        point_fait=12.0,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=94,
        point_potentiel=106.0,  # (70 from eci_2 and 36 from eci_1)
        point_referentiel=100,
        concerne=True,
        total_taches_count=5,
        completed_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=None,
    )


def test_notation_when_potentiel_perso_formule_is_given(simple_point_tree_referentiel):
    consequences = {
        ActionId("eci_1"): ActionPersonnalisationConsequence(
            score_formule="min(score(eci_1), score(eci_2))"
        )
    }
    statuses: list[ActionStatut] = [
        ActionStatut(
            action_id=ActionId("eci_2.2"),
            detailed_avancement=DetailedAvancement(1, 0, 0),  # worth 5 points
            concerne=True,
        ),
        ActionStatut(
            action_id=ActionId("eci_1.1"),
            detailed_avancement=DetailedAvancement(1, 0, 0),  # worth 10 points
            concerne=True,
        ),
        ActionStatut(
            action_id=ActionId("eci_1.2"),
            detailed_avancement=DetailedAvancement(1, 0, 0),  # worth 30 points
            concerne=True,
        ),
    ]
    actual_scores = compute_scores(
        simple_point_tree_referentiel, statuses, consequences, action_level=1
    )

    # Action eci_2 should not have been changed
    assert actual_scores[ActionId("eci_2")] == ActionScore(
        action_id=ActionId("eci_2"),
        point_fait=5,
        point_programme=0.0,
        point_pas_fait=0.0,
        point_non_renseigne=65,
        point_potentiel=70,
        point_referentiel=70,
        concerne=True,
        total_taches_count=3,
        completed_taches_count=1,
        fait_taches_avancement=1,
        programme_taches_avancement=0,
        pas_fait_taches_avancement=0,
        pas_concerne_taches_avancement=0,
        desactive=False,
        point_potentiel_perso=None,
    )

    # Action eci_1 should have the score reduced to the same than eci_2
    assert math.isclose(
        actual_scores[ActionId("eci_1")].point_fait
        / actual_scores[ActionId("eci_1")].point_potentiel,
        actual_scores[ActionId("eci_2")].point_fait
        / actual_scores[ActionId("eci_2")].point_potentiel, 
        rel_tol=3
    )
