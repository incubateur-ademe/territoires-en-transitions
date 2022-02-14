import pytest

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
    return SupabaseReferentielRepository(supabase_client)


@pytest.mark.asyncio
async def test_get_all_definitions_from_referentiel(supabase_repo):
    all_eci_definitions = await supabase_repo.get_all_definitions_from_referentiel(
        "eci"
    )
    assert len(all_eci_definitions) == expected_nb_of_eci_actions

    all_cae_definitions = await supabase_repo.get_all_definitions_from_referentiel(
        "cae"
    )
    assert len(all_cae_definitions) == expected_nb_of_cae_actions


@pytest.mark.asyncio
async def test_get_all_action_ids_from_referentiel(supabase_repo):
    all_eci_action_ids = await supabase_repo.get_all_action_ids_from_referentiel("eci")
    assert len(all_eci_action_ids) == expected_nb_of_eci_actions
    assert "eci" in all_eci_action_ids

    all_cae_action_ids = await supabase_repo.get_all_action_ids_from_referentiel("cae")
    assert len(all_cae_action_ids) == expected_nb_of_cae_actions
    assert "cae" in all_cae_action_ids


@pytest.mark.asyncio
async def test_get_all_indicateur_ids(supabase_repo):
    all_indicateur_ids = await supabase_repo.get_all_indicateur_ids()
    assert len(all_indicateur_ids) >= expected_nb_of_indicateurs


@pytest.mark.asyncio
async def test_get_all_children_from_referentiel(supabase_repo):
    all_eci_children = await supabase_repo.get_all_children_from_referentiel("eci")
    assert len(all_eci_children) == expected_nb_of_eci_actions

    all_cae_children = await supabase_repo.get_all_children_from_referentiel("cae")
    assert len(all_cae_children) == expected_nb_of_cae_actions


@pytest.mark.asyncio
async def test_get_all_points_from_referentiel(supabase_repo):
    all_eci_points = await supabase_repo.get_all_points_from_referentiel("eci")
    assert len(all_eci_points) == expected_nb_of_eci_actions
    all_cae_points = await supabase_repo.get_all_points_from_referentiel("cae")
    assert len(all_cae_points) == expected_nb_of_cae_actions


@pytest.mark.asyncio
async def test_can_add_indicateurs(supabase_repo: SupabaseReferentielRepository):
    # Prepare : eventually, delete the indicateurs
    lala = await (
        supabase_repo.indicateur_definition_table.delete({"id": "indicateur_1"})
    )
    breakpoint()
    # lala = (
    #     supabase_repo.indicateur_definition_table.delete()
    #     .eq("id", "indicateur_1")
    #     .execute()
    # )
    # Act : Add those indicateurs
    indicateur_1 = make_indicateur(
        indicateur_id="indicateur_1",
        indicateur_group="eci",
        description="les poissons !",
        action_ids=[],
    )
    indicateur_2 = make_indicateur(
        indicateur_id="indicateur_2",
        indicateur_group="eci",
        description="le bleu d'la mer :) ",
        action_ids=["eci_1"],
    )
    await supabase_repo.add_indicateurs([indicateur_1, indicateur_2])
    breakpoint()
