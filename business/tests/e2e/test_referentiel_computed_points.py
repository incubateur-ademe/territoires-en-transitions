import pytest
from business.referentiel.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)

from tests.utils.assert_children_points_sum_to_parent_point import (
    assert_children_points_sum_to_parent_point,
)
from tests.utils.supabase_fixtures import *


from business.evaluation.entrypoints.start_realtime import (
    get_config,
    get_connected_socket,
)

socket = get_connected_socket()
config = get_config(socket)


@pytest.mark.parametrize("referentiel", ["eci", "cae"])
def test_eci_referentiel_computed_points(
    referentiel, supabase_referentiel_repo: SupabaseReferentielRepository
):
    ref_computed_points = supabase_referentiel_repo.get_all_points_from_referentiel(
        referentiel
    )
    ref_children = supabase_referentiel_repo.get_all_children_from_referentiel(
        referentiel
    )
    assert_children_points_sum_to_parent_point(ref_children, ref_computed_points)
