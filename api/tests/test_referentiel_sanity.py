import math
import pytest

from api.notation.referentiel import Referentiel
from api.notation.referentiel_eci import referentiel_eci


def _points_error_message(referentiel: Referentiel, index: tuple) -> str:
    """Returns the error message that explains how parent points differ from the total of its children."""
    children = referentiel_eci.children(index)
    total_points = sum([referentiel_eci.points[child] for child in children])
    total_percentage = sum([referentiel_eci.percentages[child] for child in children])

    return f"Le total en pourcentage des {len(children)} enfants de {referentiel.actions[index].id} " \
           f"n'est pas égal à 100% mais est égal à {total_percentage * 100}%. " \
           f"Le total des points n'est pas de {referentiel.points[index]} mais est égal à {total_points}."


@pytest.mark.parametrize("index", referentiel_eci.backward)
def test_eci_action_points(index):
    """Test that an action points is equal to the total points of its children."""
    children = referentiel_eci.children(index)
    if children:
        total_points = sum([referentiel_eci.points[child] for child in children])
        assert math.isclose(total_points, referentiel_eci.points[index]), _points_error_message(referentiel_eci, index)
