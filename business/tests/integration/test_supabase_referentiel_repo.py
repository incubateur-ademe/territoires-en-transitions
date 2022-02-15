import pytest
from business.evaluation.adapters import supabase_names

from business.referentiel.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)
from tests.utils.referentiel_factory import make_indicateur
from tests.utils.supabase_fixtures import *

# Note : those should not change very often.
expected_nb_of_eci_actions = 368
expected_nb_of_cae_actions = 1478
expected_nb_of_indicateurs = 180


@pytest.fixture()
def supabase_repo(supabase_client) -> SupabaseReferentielRepository:
    supabase_client.db.delete_by(
        supabase_names.tables.indicateur_definition, {"id": "like.test_%"}
    )

    return SupabaseReferentielRepository(supabase_client)


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
    assert len(all_indicateur_ids) >= expected_nb_of_indicateurs


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


def test_can_add_indicateurs(
    supabase_repo: SupabaseReferentielRepository, supabase_client
):
    # Act : Add those indicateurs
    indicateur_1 = make_indicateur(
        indicateur_id="test_1",
        indicateur_group="eci",
        description="les poissons !",
        action_ids=[],
    )
    indicateur_2 = make_indicateur(
        indicateur_id="test_2",
        indicateur_group="eci",
        description="le bleu d'la mer :) ",
        action_ids=["eci_1"],
    )
    supabase_repo.upsert_indicateurs([indicateur_1, indicateur_2])

    # Assert :
    # 1. check that the indicateurs exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.indicateur_definition, {"id": "like.test_%"}
    )
    assert len(defs) == 2

    # 2. check that indicateur_action exist in DB
    indic_actions = supabase_client.db.get_by(
        supabase_names.tables.indicateur_action, {"indicateur_id": "eq.indicateur_2"}
    )
    assert len(indic_actions) == 1


def test_can_update_indicateurs(
    supabase_repo: SupabaseReferentielRepository, supabase_client
):
    # Prepare : add an indicateur
    existing_indicateur = make_indicateur(
        indicateur_id="test_8",
    )
    supabase_repo.upsert_indicateurs([existing_indicateur])

    # Act : Update this indicateur
    updated_indicateur = make_indicateur(
        indicateur_id=existing_indicateur.indicateur_id,
        description="un truc a changé ",
    )
    supabase_repo.upsert_indicateurs([updated_indicateur])

    # Assert :
    # 1. check that the indicateurs exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.indicateur_definition,
        {"id": f"eq.{existing_indicateur.indicateur_id}"},
    )
    assert defs[0]["description"] == updated_indicateur.description
