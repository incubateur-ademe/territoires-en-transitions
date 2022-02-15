import pytest


from tests.utils.assert_children_points_sum_to_parent_point import (
    assert_children_points_sum_to_parent_point,
)


from business.evaluation.entrypoints.start_realtime import (
    get_config,
    get_connected_socket,
)

socket = get_connected_socket()
config = get_config(socket)


@pytest.mark.parametrize("referentiel", ["eci", "cae"])
def test_eci_referentiel_computed_points(referentiel):
    ref_repo = config.get_referentiel_repo()
    ref_computed_points = ref_repo.get_all_points_from_referentiel(referentiel)
    ref_children = ref_repo.get_all_children_from_referentiel(referentiel)
    assert_children_points_sum_to_parent_point(ref_children, ref_computed_points)
