import math

from api.notation.referentiel import Referentiel


def referentiel_sanity(referentiel: Referentiel):
    """Assert that every referentiel action points are equal to the total points of its children."""
    for index in referentiel.backward:
        children = referentiel.children(index)
        if children:
            total_points = sum([referentiel.points[child] for child in children])
            assert math.isclose(
                total_points, referentiel.points[index]
            ), f"{index} points {referentiel.points[index]} != children points {total_points}"
