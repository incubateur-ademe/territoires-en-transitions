import pytest
from business.evaluation.adapters import supabase_names

from business.referentiel.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)
from tests.utils.referentiel_factory import (
    make_action_definition,
    make_action_points,
    make_indicateur,
)
from tests.utils.supabase_fixtures import *

# Note : those should not change very often.
expected_nb_of_eci_actions = 367
expected_nb_of_cae_actions = 1478
expected_nb_of_indicateurs = 180


def test_get_all_definitions_from_referentiel(
    supabase_referentiel_repo: SupabaseReferentielRepository,
):
    all_eci_definitions = (
        supabase_referentiel_repo.get_all_definitions_from_referentiel("eci")
    )
    assert len(all_eci_definitions) == expected_nb_of_eci_actions

    all_cae_definitions = (
        supabase_referentiel_repo.get_all_definitions_from_referentiel("cae")
    )
    assert len(all_cae_definitions) == expected_nb_of_cae_actions


def test_get_all_action_ids_from_referentiel(
    supabase_referentiel_repo: SupabaseReferentielRepository,
):
    all_eci_action_ids = supabase_referentiel_repo.get_all_action_ids("eci")
    assert len(all_eci_action_ids) == expected_nb_of_eci_actions
    assert "eci" in all_eci_action_ids

    all_cae_action_ids = supabase_referentiel_repo.get_all_action_ids("cae")
    assert len(all_cae_action_ids) == expected_nb_of_cae_actions
    assert "cae" in all_cae_action_ids


def test_get_all_indicateur_ids(
    supabase_referentiel_repo: SupabaseReferentielRepository,
):
    all_indicateur_ids = supabase_referentiel_repo.get_all_indicateur_ids()
    assert len(all_indicateur_ids) >= expected_nb_of_indicateurs


def test_get_all_children_from_referentiel(supabase_referentiel_repo):
    all_eci_children = supabase_referentiel_repo.get_all_children_from_referentiel(
        "eci"
    )
    assert len(all_eci_children) == expected_nb_of_eci_actions

    all_cae_children = supabase_referentiel_repo.get_all_children_from_referentiel(
        "cae"
    )
    assert len(all_cae_children) == expected_nb_of_cae_actions


def test_get_all_points_from_referentiel(supabase_referentiel_repo):
    all_eci_points = supabase_referentiel_repo.get_all_points_from_referentiel("eci")
    assert len(all_eci_points) == expected_nb_of_eci_actions
    all_cae_points = supabase_referentiel_repo.get_all_points_from_referentiel("cae")
    assert len(all_cae_points) == expected_nb_of_cae_actions


def test_can_add_indicateurs(
    supabase_referentiel_repo: SupabaseReferentielRepository, supabase_client
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
    supabase_referentiel_repo.upsert_indicateurs([indicateur_1, indicateur_2])

    # Assert :
    # 1. check that the indicateurs exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.indicateur_definition, {"id": "like.test%"}
    )
    assert len(defs) == 2

    # 2. check that indicateur_action exist in DB
    indic_actions = supabase_client.db.get_by(
        supabase_names.tables.indicateur_action, {"indicateur_id": "eq.test_2"}
    )
    assert len(indic_actions) == 1


def test_can_update_indicateurs(
    supabase_referentiel_repo: SupabaseReferentielRepository,
    supabase_client: SupabaseClient,
):
    # Prepare : add an indicateur
    existing_indicateur = make_indicateur(
        indicateur_id="test_8",
    )
    supabase_referentiel_repo.upsert_indicateurs([existing_indicateur])

    # Act : Update this indicateur
    updated_indicateur = make_indicateur(
        indicateur_id=existing_indicateur.indicateur_id,
        description="un truc a changé ",
    )
    supabase_referentiel_repo.upsert_indicateurs([updated_indicateur])

    # Assert :
    # 1. check that the indicateurs exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.indicateur_definition,
        {"id": f"eq.{existing_indicateur.indicateur_id}"},
    )
    assert defs[0]["description"] == updated_indicateur.description


def test_can_update_actions(
    supabase_referentiel_repo: SupabaseReferentielRepository,
    supabase_client: SupabaseClient,
):
    # Prepare : add an action_children (but no def and no point)
    action_id = "test"
    referentiel = "eci"
    supabase_client.db.insert(
        supabase_names.tables.action_relation,
        {"referentiel": referentiel, "id": action_id, "parent": None},
    )
    supabase_client.db.insert(
        supabase_names.tables.action_definition,
        {
            "action_id": action_id,
            "referentiel": "eci",
            "identifiant": "old stuff",
            "nom": "old stuff",
            "description": "old stuff",
            "contexte": "old stuff",
            "exemples": "old stuff",
            "ressources": "old stuff",
            "perimetre_evaluation": "old stuff",
            "reduction_potentiel": "old stuff",
            "preuve": "old stuff",
            "points": 42,
            "pourcentage": 42,
        },
    )
    supabase_client.db.insert(
        supabase_names.tables.action_computed_points,
        {
            "action_id": action_id,
            "value": 23,
        },
    )
    # Act : Update this action giving it a def and point
    updated_def = make_action_definition(
        action_id=action_id,
        referentiel=referentiel,
        description="new stuff",
        reduction_potentiel="new stuff",
        perimetre_evaluation="new stuff",
    )
    updated_point = make_action_points(action_id=action_id, points=42)

    supabase_referentiel_repo.update_referentiel_actions([updated_def], [updated_point])

    # Assert :
    # 1. check that the definition exist in DB
    defs = supabase_client.db.get_by(
        supabase_names.tables.action_definition,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(defs) == 1
    assert defs[0]["description"] == updated_def.description
    assert defs[0]["reduction_potentiel"] == updated_def.reduction_potentiel
    assert defs[0]["perimetre_evaluation"] == updated_def.perimetre_evaluation

    # 2. check that the point exist in DB
    points = supabase_client.db.get_by(
        supabase_names.tables.action_computed_points,
        {"action_id": f"eq.{action_id}"},
    )
    assert len(points) == 1
    assert points[0]["value"] == updated_point.value
