import math

import pytest

from api.notation.notation import Notation
from api.notation.referentiel import Referentiel
from api.notation.referentiels import referentiel_cae


@pytest.fixture
def referentiel() -> Referentiel:
    return referentiel_cae


@pytest.fixture
def notation(referentiel: Referentiel) -> Notation:
    return Notation(referentiel)


def test_points_level_3(referentiel: Referentiel):
    math.isclose(referentiel.points[("1", "1", "1")], 12)


def test_points_level_4(referentiel: Referentiel):
    # Compare hard coded value
    # Points value in level 3 for CAE (1.1.1.1 here) are expressed in percentage
    # Hence 5 points is relative to 1.1.1 points which is 12 points.
    math.isclose(referentiel.points[("1", "1", "1", "1")], 12 / 5)
