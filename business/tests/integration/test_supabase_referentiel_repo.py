from tests.utils.supabase_fixtures import *

# Note : those should not change very often.
expected_nb_of_eci_actions = 368
expected_nb_of_cae_actions = 1478
expected_nb_of_indicateurs = 122


def test_get_all_definitions_from_referentiel(supabase_repo):
    all_eci_definitions = supabase_repo.get_all_definitions_from_referentiel("eci")
    assert len(all_eci_definitions) == expected_nb_of_eci_actions

    all_cae_definitions = supabase_repo.get_all_definitions_from_referentiel("cae")
    assert len(all_cae_definitions) == expected_nb_of_cae_actions


def test_get_all_action_ids_from_referentiel(supabase_repo):
    all_eci_action_ids = supabase_repo.get_all_action_ids_from_referentiel("eci")
    assert len(all_eci_action_ids) == expected_nb_of_eci_actions
    assert "eci" in all_eci_action_ids

    all_cae_action_ids = supabase_repo.get_all_action_ids_from_referentiel("cae")
    assert len(all_cae_action_ids) == expected_nb_of_cae_actions
    assert "cae" in all_cae_action_ids


def test_get_all_indicateur_ids(supabase_repo):
    all_indicateur_ids = supabase_repo.get_all_indicateur_ids()
    assert len(all_indicateur_ids) == expected_nb_of_indicateurs


def test_get_all_children_from_referentiel(supabase_repo):
    all_eci_children = supabase_repo.get_all_children_from_referentiel("eci")
    assert len(all_eci_children) == expected_nb_of_eci_actions

    all_cae_children = supabase_repo.get_all_children_from_referentiel("cae")
    assert len(all_cae_children) == expected_nb_of_cae_actions


def test_get_all_points_from_referentiel(supabase_repo):
    all_eci_points = supabase_repo.get_all_points_from_referentiel("eci")
    assert len(all_eci_points) == expected_nb_of_eci_actions
    all_cae_points = supabase_repo.get_all_points_from_referentiel("cae")
    assert len(all_cae_points) == expected_nb_of_cae_actions
