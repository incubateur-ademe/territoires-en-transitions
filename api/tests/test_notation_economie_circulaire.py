import math

import pytest

from api.notation.notation import Notation, Status
from api.notation.referentiel import Referentiel
from api.notation.referentiel_eci import referentiel_eci


@pytest.fixture
def referentiel() -> Referentiel:
    return referentiel_eci


@pytest.fixture
def notation(referentiel: Referentiel) -> Notation:
    return Notation(referentiel)


def test_referentiel(referentiel: Referentiel):
    # Compare hard a coded value
    math.isclose(referentiel.points[("1", "1", "1")], 6.6)


def test_notation(notation: Notation):
    """In orientation 1.1.1 mark everything 'fait'

    So that the grand total is the same as the orientation 1.1.1 points from référentiel
    """
    niveaux_of_1_1_1 = notation.referentiel.children(("1", "1", "1"))
    for niveau in niveaux_of_1_1_1:
        notation.statuses[niveau] = Status.faite

    point_of_1_1_1 = notation.referentiel.points[("1", "1", "1")]
    notation.compute()

    # test that orientation 1.1.1 have score 100% of the points
    assert math.isclose(notation.points[("1", "1", "1")], point_of_1_1_1)

    # test that orientation 1.1.2 points is 0
    assert notation.points[("1", "1", "2")] == 0

    # test that the point of root (that is the grand total) is equal to orientation 1.1.1
    assert math.isclose(notation.points[tuple()], point_of_1_1_1)

    # everything is marked as fait in orientation so the percentatge should be 100%
    assert math.isclose(notation.percentages[("1", "1", "1")], 1.0)


def test_notation_redistribution(notation: Notation):
    """In orientation 1.1.1 mark everything 'non_concernee' except 1st niveau

    So that 1st niveau is worth all the points of its parent orientation
    """
    niveaux_of_1_1_1 = notation.referentiel.children(("1", "1", "1"))
    for niveau in niveaux_of_1_1_1:
        notation.statuses[niveau] = Status.non_concernee

    notation.statuses[niveaux_of_1_1_1[0]] = Status.faite
    point_of_1_1_1 = notation.referentiel.points[("1", "1", "1")]
    notation.compute()

    # test that orientation 1.1.1 have score 100% of the points
    assert math.isclose(notation.points[("1", "1", "1")], point_of_1_1_1)

    # test that niveau 1.1.1.1 is worth the total its parent orientation.
    assert math.isclose(notation.points[("1", "1")], point_of_1_1_1)

    # test that tache 1.1.1.1 is worth the total its parent orientation.
    assert math.isclose(notation.points[("1", "1", "1", "1")], point_of_1_1_1)
