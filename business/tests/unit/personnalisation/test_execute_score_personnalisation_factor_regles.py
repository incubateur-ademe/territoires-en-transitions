from business.evaluation.personnalisation.execute_score_personnalisation_factor_regle import (
    execute_score_personnalisation_override_regle,
)
from business.utils.models.actions import ActionId
from tests.utils.score_factory import make_action_score


def test_execute_score_personnalisation_factor_regles_when_score_is_given():
    assert (
        execute_score_personnalisation_override_regle(
            "min(score(eci_1), 0.8)",
            {
                ActionId("eci_1"): make_action_score(
                    action_id="eci_1",
                    point_fait=10,
                    point_potentiel=20,  # score = 10/20 = 0.5
                )
            },
        )
        == 0.5
    )

    assert (
        execute_score_personnalisation_override_regle(
            "min(score(eci_1), 0.8)",
            {
                ActionId("eci_1"): make_action_score(
                    action_id="eci_1",
                    point_fait=20,
                    point_potentiel=20,  # score = 1.0
                )
            },
        )
        == 0.8
    )


def test_execute_score_personnalisation_factor_regles_when_score_is_not_given():
    assert (
        execute_score_personnalisation_override_regle(
            "min(score(eci_1), 0.8)",
            {},
        )
        == None
    )
