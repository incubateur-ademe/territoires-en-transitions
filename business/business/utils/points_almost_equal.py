import math


def points_almost_equal(a: float, b: float):
    return math.isclose(
        a,
        b,
        rel_tol=1e-5,
    )
