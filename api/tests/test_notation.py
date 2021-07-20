from typing import List, Optional

import pytest

from api.notation.notation import Notation, Status, UnknownActionIndex
from api.models.generated.action_referentiel_score import ActionReferentielScore
from api.notation.referentiel import Referentiel
from api.notation.referentiel import (
    defaut_referentiel_axis_points_value,
    defaut_referentiel_root_points_value,
)
from tests.utils.factory import make_action_referentiel


def find_score_with_id_nomenclature(
    scores: List[ActionReferentielScore], nomenclature_id: str
) -> Optional[ActionReferentielScore]:
    return next(
        iter(
            [
                score
                for score in scores
                if score.action_nomenclature_id == nomenclature_id
            ]
        ),
        None,
    )


def assert_score_with_nomenclature_id_equals(
    scores: List[ActionReferentielScore],
    nomenclature_id: str,
    *,
    points: float,
    percentage: float,
    potentiel: float,
    referentiel_points: float,
    referentiel_percentage: float,
):
    score = find_score_with_id_nomenclature(scores, nomenclature_id)
    assert score

    assert score.points == points
    assert score.percentage == percentage
    assert score.potentiel == potentiel
    assert score.referentiel_points == referentiel_points
    assert score.referentiel_percentage == referentiel_percentage


def test_notation_only_root_default_status():
    referentiel = Referentiel(root_action=make_action_referentiel())
    notation = Notation(referentiel)

    scores = notation.compute_and_get_scores()

    assert_score_with_nomenclature_id_equals(
        scores,
        "",
        points=0.0,
        percentage=0.0,
        potentiel=defaut_referentiel_root_points_value,
        referentiel_points=defaut_referentiel_root_points_value,
        referentiel_percentage=1,
    )


@pytest.fixture
def referentiel() -> Referentiel:
    action_1_1 = make_action_referentiel(id_nomenclature="1.1", actions=[], points=30)
    action_1_2 = make_action_referentiel(id_nomenclature="1.2", actions=[], points=70)
    action_1 = make_action_referentiel(
        id_nomenclature="1", actions=[action_1_1, action_1_2]
    )
    root_action = make_action_referentiel(actions=[action_1])
    referentiel = Referentiel(root_action)
    return referentiel


@pytest.fixture
def notation(referentiel) -> Notation:
    return Notation(referentiel)


def test_notation_with_two_actions_default_status(notation):
    scores = notation.compute_and_get_scores()

    assert_score_with_nomenclature_id_equals(
        scores,
        "",
        points=0.0,
        percentage=0.0,
        potentiel=defaut_referentiel_root_points_value,
        referentiel_points=defaut_referentiel_root_points_value,
        referentiel_percentage=1,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1",
        points=0.0,
        percentage=0.0,
        potentiel=defaut_referentiel_axis_points_value,
        referentiel_points=defaut_referentiel_axis_points_value,
        referentiel_percentage=defaut_referentiel_axis_points_value
        / defaut_referentiel_root_points_value,
    )
    assert_score_with_nomenclature_id_equals(
        scores,
        "1.1",
        points=0.0,
        percentage=0.0,
        potentiel=30,
        referentiel_points=30,
        referentiel_percentage=0.3,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1.2",
        points=0.0,
        percentage=0.0,
        potentiel=70,
        referentiel_points=70,
        referentiel_percentage=0.7,
    )


def test_status_if_index_exists(notation):
    notation.set_status(index=("1", "1"), status=Status.non_concernee)
    assert notation.statuses[("1", "1")] == Status.non_concernee


def test_status_if_index_does_not_exists(notation):
    with pytest.raises(UnknownActionIndex):
        notation.set_status(index=(1, 3), status=Status.non_concernee)


def test_notation_with_two_actions_amongst_which_one_is_non_concernee(notation):
    notation.set_status(index=("1", "1"), status=Status.non_concernee)

    scores = notation.compute_and_get_scores()

    assert_score_with_nomenclature_id_equals(
        scores,
        "",
        points=0.0,
        percentage=0.0,
        potentiel=defaut_referentiel_root_points_value,
        referentiel_points=defaut_referentiel_root_points_value,
        referentiel_percentage=1,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1",
        points=0.0,
        percentage=0.0,
        potentiel=defaut_referentiel_axis_points_value,
        referentiel_points=defaut_referentiel_axis_points_value,
        referentiel_percentage=defaut_referentiel_axis_points_value
        / defaut_referentiel_root_points_value,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1.1",
        points=0.0,
        percentage=0.0,
        potentiel=0.0,
        referentiel_points=30,
        referentiel_percentage=0.3,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1.2",
        points=0.0,
        percentage=0.0,
        potentiel=defaut_referentiel_axis_points_value,  # points have been redistributed
        referentiel_points=70,
        referentiel_percentage=0.7,
    )


def test_notation_with_two_actions_amongst_which_one_is_faite(notation):
    notation.set_status(index=("1", "1"), status=Status.faite)

    scores = notation.compute_and_get_scores()

    assert_score_with_nomenclature_id_equals(
        scores,
        "",
        points=30.0,
        percentage=0.3
        * defaut_referentiel_axis_points_value
        / defaut_referentiel_root_points_value,
        potentiel=defaut_referentiel_root_points_value,
        referentiel_points=defaut_referentiel_root_points_value,
        referentiel_percentage=1,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1",
        points=30.0,
        percentage=0.3,
        potentiel=defaut_referentiel_axis_points_value,
        referentiel_points=defaut_referentiel_axis_points_value,
        referentiel_percentage=defaut_referentiel_axis_points_value
        / defaut_referentiel_root_points_value,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1.1",
        points=30.0,
        percentage=1.0,
        potentiel=30,
        referentiel_points=30,
        referentiel_percentage=0.3,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1.2",
        points=0.0,
        percentage=0.0,
        potentiel=70,
        referentiel_points=70,
        referentiel_percentage=0.7,
    )


def test_notation_with_two_actions_from_which_parent_axis_is_faite(notation):
    notation.set_status(index=("1",), status=Status.faite)

    scores = notation.compute_and_get_scores()

    assert notation.statuses[("1", "1")] == Status.faite
    assert notation.statuses[("1", "2")] == Status.faite

    assert_score_with_nomenclature_id_equals(
        scores,
        "",
        points=defaut_referentiel_axis_points_value,
        percentage=defaut_referentiel_axis_points_value
        / defaut_referentiel_root_points_value,
        potentiel=defaut_referentiel_root_points_value,
        referentiel_points=defaut_referentiel_root_points_value,
        referentiel_percentage=1,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1",
        points=defaut_referentiel_axis_points_value,
        percentage=1.0,
        potentiel=defaut_referentiel_axis_points_value,
        referentiel_points=defaut_referentiel_axis_points_value,
        referentiel_percentage=defaut_referentiel_axis_points_value
        / defaut_referentiel_root_points_value,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1.1",
        points=30.0,
        percentage=1.0,
        potentiel=30,
        referentiel_points=30,
        referentiel_percentage=0.3,
    )

    assert_score_with_nomenclature_id_equals(
        scores,
        "1.2",
        points=70.0,
        percentage=1.0,
        potentiel=70,
        referentiel_points=70,
        referentiel_percentage=0.7,
    )
