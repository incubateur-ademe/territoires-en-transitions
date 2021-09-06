import pytest

from api.notation.referentiel import Referentiel, ReferentielValueError
from tests.utils.factory import make_action_referentiel


def test_referentiel_fails_when_wrong_root_action():
    with pytest.raises(ReferentielValueError):
        referentiel = Referentiel(
            root_action=make_action_referentiel(id_nomenclature="not_empty")
        )


def test_referentiel_when_some_root_action_has_no_actions():
    root_action = make_action_referentiel(actions=[])
    referentiel = Referentiel(root_action)
    assert referentiel.backward == [()]
    assert referentiel.forward == [()]


def test_referentiel_when_root_action_has_one_level():
    action_1_1 = make_action_referentiel(id="ref__1", id_nomenclature="1", actions=[])
    root_action = make_action_referentiel(
        id="ref", id_nomenclature="", actions=[action_1_1], points=42
    )
    referentiel = Referentiel(root_action)

    assert referentiel.indices == [(), ("1",)]
    assert referentiel.backward == [("1",), ()]
    assert referentiel.forward == [(), ("1",)]
    assert referentiel.actions == {(): root_action, ("1",): action_1_1}
    assert referentiel.points == {(): 500, ("1",): 100}
    assert referentiel.percentages == {(): 1, ("1",): 0.2}
