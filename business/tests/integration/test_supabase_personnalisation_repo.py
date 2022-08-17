import pytest
from business.evaluation.adapters import supabase_names

from business.personnalisation.adapters.supabase_personnalisation_repo import (
    SupabasePersonnalisationRepository,
)
from business.personnalisation.models import (
    ActionPersonnalisationConsequence,
    IdentiteCollectivite,
    Reponse,
)
from business.utils.action_id import ActionId
from tests.utils.supabase_fixtures import *


@pytest.fixture()
def supabase_repo(supabase_client) -> SupabasePersonnalisationRepository:
    return SupabasePersonnalisationRepository(supabase_client)


def test_save_action_personnalisation_consequences_for_collectivite_to_repo_should_write_in_postgres(
    supabase_repo: SupabasePersonnalisationRepository, supabase_client: SupabaseClient
):
    collectivite_id = 23
    # 1. Save personnalisation consequences on this collectivite
    supabase_repo.save_action_personnalisation_consequences_for_collectivite(
        collectivite_id=collectivite_id,
        action_personnalisation_consequences={
            ActionId("test_1"): ActionPersonnalisationConsequence(
                desactive=True, potentiel_perso=0.6, score_formule="max(1, 2)"
            ),
            ActionId("test_2"): ActionPersonnalisationConsequence(
                desactive=None, potentiel_perso=0.9
            ),
        },
    )

    # Assert : check personnalisation consequences has been inserted
    stored_consequences = supabase_client.db.get_by(
        supabase_names.tables.personnalisation_consequence,
        filters={"collectivite_id": f"eq.{collectivite_id}"},
    )
    assert len(stored_consequences) == 1
    assert stored_consequences[0]["collectivite_id"] == collectivite_id
    assert stored_consequences[0]["consequences"] == {
        "test_1": {
            "desactive": True,
            "potentiel_perso": 0.6,
            "score_formule": "max(1, 2)",
        },
        "test_2": {
            "desactive": None,
            "potentiel_perso": 0.9,
            "score_formule": None,
        },
    }

    # 2. Update the score for same collectivite, same referentiel
    supabase_repo.save_action_personnalisation_consequences_for_collectivite(
        collectivite_id=collectivite_id,
        action_personnalisation_consequences={
            ActionId("test_3"): ActionPersonnalisationConsequence(
                desactive=True, potentiel_perso=None
            ),
        },
    )

    # Assert : check score has been updated
    updated_consequences = supabase_client.db.get_by(
        supabase_names.tables.personnalisation_consequence,
        filters={"collectivite_id": f"eq.{collectivite_id}"},
    )
    assert updated_consequences[0]["consequences"] == {
        "test_3": {
            "desactive": True,
            "potentiel_perso": None,
            "score_formule": None,
        }
    }


def test_get_personnalisation_regles_should_return_all_personnalisation_regles(
    supabase_repo: SupabasePersonnalisationRepository,
):
    personnalisation_regles = supabase_repo.get_personnalisation_regles()
    expected_action_id_with_regles = [
        "cae_6.4.1.6",
        "eci_1.2.2",
        "eci_3.2.0",
        "eci_4.2.3",
        "cae_3.1.1",
        "cae_1.3.3",
        "cae_3.2.3",
        "eci_2.1",
        "cae_4.1.2.4",
        "cae_6.4.1",
        "cae_3.1.2.2",
        "cae_4.2.3",
        "cae_4.2.1",
        "cae_6.2.3",
        "eci_3.4.2",
        "cae_3.2.1.2",
        "cae_3.3.1",
        "cae_6.5.2",
        "eci_4.3",
        "cae_2.2.3.3",
        "cae_1.3.2",
        "cae_6.4.2",
        "cae_6.4.1.8",
        "cae_4.1.2.1",
        "cae_1.2.4",
        "eci_4.2.4",
        "eci_2.4.4",
        "eci_4.2.1",
        "cae_4.3.4",
        "cae_1.2.3",
        "cae_3.1.2",
        "eci_4.2.5",
        "cae_3.3.3",
        "cae_6.3.1.5",
        "eci_2.4.2",
        "cae_3.2.2",
        "eci_3.7.2",
        "cae_6.3.1.4",
        "eci_3.7.1",
        "cae_3.2.1.3",
        "cae_4.1.2.3",
        "cae_4.2.2",
        "cae_2.2.3.2",
        "cae_6.3.2",
        "cae_6.2.4",
        "cae_6.5.2.5",
        "cae_4.3.1",
        "eci_1.2.4",
        "cae_4.3.3",
        "cae_4.1.1",
        "cae_6.5.3",
        "eci_2.4.3",
        "cae_2.2.3",
        "eci_4.2.2",
        "cae_2.3.1",
        "cae_6.2.1",
        "cae_2.2.3.1",
        "cae_3.3.2",
        "cae_6.2.2",
        "eci_4.1",
        "cae_1.3.1",
        "cae_6.3.1",
        "cae_4.1.2",
        "cae_1.2.2",
        "cae_2.3.3",
        "cae_3.2.1",
        "cae_3.3.5",
        "cae_6.1.2",
        "eci_3.4",
        "eci_2.3",
        "cae_4.3.2",
        "eci_1.2.3",
        "cae_6.3.1.3",
        "eci_2.2",
    ]
    actual_action_id_with_regles = {
        personnalisation_regle.action_id
        for personnalisation_regle in personnalisation_regles
    }
    
    assert len(personnalisation_regles) > 50
    assert set(expected_action_id_with_regles).issubset(
        actual_action_id_with_regles
    ), f"Missing regles expected for actions {[action_id for action_id in expected_action_id_with_regles if action_id not in actual_action_id_with_regles]}"


def test_get_reponses_for_collectivite_returns_fakes_for_collectivite_1(
    supabase_repo: SupabasePersonnalisationRepository,
):
    collectivite_1_retrieved_responses = supabase_repo.get_reponses_for_collectivite(1)
    expected_reponses = [
        Reponse(id="dechets_1", value="OUI"),
        Reponse(id="habitat_2", value=0.8),
        Reponse(id="EP_1", value="EP_1_b"),
    ]
    assert len(collectivite_1_retrieved_responses) == 3
    for reponse in expected_reponses:
        assert reponse in collectivite_1_retrieved_responses


def test_get_reponses_for_collectivite_returns_empty_list_for_collectivite_3(
    supabase_repo: SupabasePersonnalisationRepository,
):
    collectivite_3_fake_responses = supabase_repo.get_reponses_for_collectivite(3)
    assert collectivite_3_fake_responses == []


def test_get_action_personnalisation_consequences_for_collectivite(
    supabase_repo: SupabasePersonnalisationRepository,
    supabase_client: SupabaseClient,
):
    # Prepare : insert consequence for collectivite 1
    supabase_client.db.insert(
        supabase_names.tables.personnalisation_consequence,
        {
            "collectivite_id": 1,
            "consequences": {"test_1": {"desactive": True, "potentiel_perso": 0.9}},
        },
        merge_duplicates=True,
    )

    # Retrieve consequence for collectivite 1
    retrieved_consequences = (
        supabase_repo.get_action_personnalisation_consequences_for_collectivite(1)
    )
    assert retrieved_consequences == {
        "test_1": ActionPersonnalisationConsequence(desactive=True, potentiel_perso=0.9)
    }


def manual_test_can_get_unprocessed_events(
    supabase_repo: SupabasePersonnalisationRepository,
):
    # 1. Manually insert a new reponse in database
    # 2. Retrieve this unprocessed event from view
    actual_unprocessed_events = supabase_repo.get_unprocessed_reponse_events()
    assert len(actual_unprocessed_events) == 1


def test_get_identite_for_collectivite_1(
    supabase_repo: SupabasePersonnalisationRepository,
):
    collectivite_1_identite = supabase_repo.get_identite_for_collectivite(1)
    expected_identite = IdentiteCollectivite(
        type={"commune"}, population= {'moins_de_100000', 'moins_de_20000'}, localisation=set()
    )
    assert collectivite_1_identite == expected_identite
