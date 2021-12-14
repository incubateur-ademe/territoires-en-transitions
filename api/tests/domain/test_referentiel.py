import pytest

from api.notation.referentiel import Referentiel, ReferentielValueError
from tests.utils.factory import make_action_referentiel


def test_referentiel_fails_when_wrong_root_action():
    with pytest.raises(ReferentielValueError):
        referentiel = Referentiel(
            root_action=make_action_referentiel(id_nomenclature="not_empty"),
            mesure_depth=3,
        )


def test_referentiel_when_some_root_action_has_no_actions():
    root_action = make_action_referentiel(actions=[])
    referentiel = Referentiel(root_action, mesure_depth=3)
    assert referentiel.backward == [()]
    assert referentiel.forward == [()]


def test_referentiel_when_root_action_has_one_mesure():
    action_1_1_1_0 = make_action_referentiel(
        id="ref__1_1_1_0",
        id_nomenclature="1.1.1.0",
        actions=[],
        points=0,  # Réglementaire
    )

    action_1_1_1_1 = make_action_referentiel(
        id="ref__1_1_1_1", id_nomenclature="1.1.1.1", actions=[], points=20  # %
    )
    action_1_1_1_2 = make_action_referentiel(
        id="ref__1_1_1_2",
        id_nomenclature="1.1.1.2",
        actions=[],  # No points specified !
    )

    action_1_1_1 = make_action_referentiel(
        id="ref__1_1_1",
        id_nomenclature="1.1.1",
        actions=[action_1_1_1_0, action_1_1_1_1, action_1_1_1_2],
        points=30,  # %
    )
    action_1_1_2 = make_action_referentiel(
        id="ref__1_1_2", id_nomenclature="1.1.2", actions=[], points=70  # %
    )

    action_1_2_1 = make_action_referentiel(
        id="ref__1_2_1", id_nomenclature="1.2.1", actions=[]
    )

    action_1_2 = make_action_referentiel(
        id="ref__1_2", id_nomenclature="1.2", actions=[action_1_2_1], points=200
    )
    action_1_1 = make_action_referentiel(
        id="ref__1_1",
        id_nomenclature="1.1",
        actions=[action_1_1_1, action_1_1_2],
        points=300,
    )

    action_1 = make_action_referentiel(
        id="ref__1", id_nomenclature="1", actions=[action_1_1, action_1_2]
    )

    root_action = make_action_referentiel(
        id="ref", id_nomenclature="", actions=[action_1]
    )
    referentiel = Referentiel(root_action, mesure_depth=2)

    assert referentiel.forward == [
        (),
        ("1",),
        ("1", "1"),
        ("1", "2"),
        ("1", "1", "1"),
        ("1", "1", "2"),
        ("1", "2", "1"),
        ("1", "1", "1", "0"),
        ("1", "1", "1", "1"),
        ("1", "1", "1", "2"),
    ]

    expected_points = {
        (): 500.0,
        ("1",): 500.0,
        ("1", "1"): 300.0,
        ("1", "2"): 200.0,
        ("1", "1", "1"): 90.0,  # 30% of 300.0
        ("1", "1", "2"): 210.0,  # 70% of 300.0
        ("1", "2", "1"): 200.0,  # 100% of 200.0
        ("1", "1", "1", "0"): 0,  # 0% of 90.0
        ("1", "1", "1", "1"): 18.0,  # 20% of 90.0
        ("1", "1", "1", "2"): 72.0,  # 80% of 90.0
    }

    expected_percentages = {
        (): 1,
        ("1",): 1,
        ("1", "1"): 3 / 5,
        ("1", "2"): 2 / 5,
        ("1", "1", "1"): 0.3,
        ("1", "1", "2"): 0.7,
        ("1", "2", "1"): 1.0,
        ("1", "1", "1", "0"): 0.0,
        ("1", "1", "1", "1"): 0.2,
        ("1", "1", "1", "2"): 0.8,
    }

    expected_childless_descendant = {
        (): 5,
        ("1",): 5,
        ("1", "1"): 4,
        ("1", "2"): 1,
        ("1", "1", "1"): 3,
        ("1", "1", "2"): 0,
        ("1", "2", "1"): 0,
        ("1", "1", "1", "0"): 0,
        ("1", "1", "1", "1"): 0,
        ("1", "1", "1", "2"): 0,
    }

    for action_index in referentiel.forward:
        assert (
            referentiel.points[action_index] == expected_points[action_index]
        ), f"Error in points at index {action_index}"

        assert (
            referentiel.percentages[action_index] == expected_percentages[action_index]
        ), f"Error in percentage at index {action_index}"

        assert (
            referentiel.childless_descendant[action_index]
            == expected_childless_descendant[action_index]
        ), f"Error in childless descendant at index {action_index}"


def test_referentiel_when_a_():
    action_1_2_1 = make_action_referentiel(
        id="ref__1_2_1", id_nomenclature="1.2.1", actions=[], points=50
    )
    action_1_2_2 = make_action_referentiel(
        id="ref__1_2_2", id_nomenclature="1.2.2", actions=[], points=50
    )

    action_1_2 = make_action_referentiel(
        id="ref__1_2", id_nomenclature="1.2", actions=[action_1_2_1, action_1_2_2]
    )

    action_1_1 = make_action_referentiel(
        id="ref__1_1", id_nomenclature="1.1", points=30
    )

    action_1 = make_action_referentiel(
        id="ref__1", id_nomenclature="1", actions=[action_1_1, action_1_2], points=500
    )

    root_action = make_action_referentiel(
        id="ref", id_nomenclature="", actions=[action_1]
    )
    referentiel = Referentiel(root_action, mesure_depth=1)
    assert referentiel.points[("1", "1")] == 150.0
    assert referentiel.points[("1", "2")] == 350.0
    assert referentiel.points[("1", "2", "1")] == 175.0
    assert referentiel.percentages[("1", "2", "1")] == 0.5
