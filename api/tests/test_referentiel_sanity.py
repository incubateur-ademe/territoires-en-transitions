import math

from api.notation.referentiel_eci import referentiel_eci


def test_referentiel_eci():
    referentiel = referentiel_eci
    for index in referentiel.backward:
        children = referentiel.children(index)
        if children:
            total_points = sum([referentiel.points[child] for child in children])
            assert \
                math.isclose(total_points, referentiel.points[index]), \
                f"Le total des points des enfants de l'action {referentiel.actions[index].id} " \
                f"n'est pas égal à {referentiel.points[index]} mais est égal à {total_points}."
