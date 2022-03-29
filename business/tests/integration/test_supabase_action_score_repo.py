import pytest
from business.evaluation.adapters import supabase_names

from business.evaluation.adapters.supabase_action_score_repo import (
    SupabaseActionScoreRepository,
)
from business.evaluation.domain.models.action_score import ActionScore
from business.utils.action_id import ActionId
from tests.utils.supabase_fixtures import *


@pytest.fixture()
def supabase_repo(supabase_client) -> SupabaseActionScoreRepository:
    return SupabaseActionScoreRepository(supabase_client)


def test_adding_and_updating_entities_for_different_collectivites_to_repo_should_write_in_postgres(
    supabase_repo: SupabaseActionScoreRepository, supabase_client: SupabaseClient
):
    collectivite_id = 23

    # Mock get_now method
    insert_date = "2022-02-02T16:00:00+00:00"
    supabase_repo.get_now = lambda: insert_date

    # 1. Create score for action "cae_1.1" on this collectivite
    supabase_repo.add_entities_for_collectivite(
        collectivite_id=collectivite_id,
        entities=[
            ActionScore(
                action_id=ActionId("cae_1.1"),
                point_potentiel=100,
                point_referentiel=100,
                point_fait=80,
                point_pas_fait=60,
                point_non_renseigne=30,
                point_programme=30,
                concerne=True,
                total_taches_count=100,
                completed_taches_count=1,
                referentiel="cae",
                point_potentiel_perso=None,
                desactive=False,
            )
        ],
    )

    # Assert : check score has been inserted
    stored_scores = supabase_client.db.get_by(
        supabase_names.tables.client_scores,
        filters={"collectivite_id": f"eq.{collectivite_id}"},
    )

    assert stored_scores == [
        {
            "collectivite_id": collectivite_id,
            "referentiel": "cae",
            "scores": [
                {
                    "action_id": "cae_1.1",
                    "point_fait": 80,
                    "point_programme": 30,
                    "point_pas_fait": 60,
                    "point_non_renseigne": 30,
                    "point_potentiel": 100,
                    "point_referentiel": 100,
                    "concerne": True,
                    "total_taches_count": 100,
                    "completed_taches_count": 1,
                    "referentiel": "cae",
                    "point_potentiel_perso": None,
                    "desactive": False,
                }
            ],
            "score_created_at": insert_date,
        }
    ]

    # 2. Update the score for same collectivite, same referentiel
    # Mock get_now method
    update_date = "2022-02-02T18:00:00+00:00"
    supabase_repo.get_now = lambda: update_date

    supabase_repo.add_entities_for_collectivite(
        collectivite_id=collectivite_id,
        entities=[
            ActionScore(
                action_id=ActionId("cae_1.1"),
                point_potentiel=100,
                point_referentiel=100,
                point_fait=80,
                point_pas_fait=60,
                point_non_renseigne=30,
                point_programme=30,
                concerne=True,
                total_taches_count=100,
                completed_taches_count=10,
                referentiel="cae",
                point_potentiel_perso=None,
                desactive=False,
            )
        ],
    )

    # Assert : check score has been updated
    stored_scores = supabase_client.db.get_by(
        supabase_names.tables.client_scores,
        filters={"collectivite_id": f"eq.{collectivite_id}"},
    )
    assert stored_scores[0]["score_created_at"] == update_date
