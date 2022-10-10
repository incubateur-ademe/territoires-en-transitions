import os
from dotenv import load_dotenv
import pytest
from business.evaluation.adapters import supabase_names
from business.evaluation.adapters.supabase_referentiel_repo import (
    SupabaseReferentielRepository,
)

from business.utils.supabase_repo import SupabaseClient

load_dotenv()
test_postgres_url = os.getenv("POSTGRES_URL", "missing_postgres_url")


@pytest.fixture()
def supabase_client() -> SupabaseClient:
    url: str = os.getenv("SUPABASE_URL", "missing_supabase_url")
    key: str = os.getenv("SUPABASE_KEY", "missing_supabase_key")
    return SupabaseClient(
        url=url,
        key=key,
    )


def reset_supabase_client(supabase_client: SupabaseClient):
    """Remove all test entities from database"""
    # Note that the order matters here /!\
    supabase_client.db.delete_by(
        supabase_names.tables.indicateur_definition, {"id": "like.test%"}
    )
    supabase_client.db.delete_by(
        supabase_names.tables.action_computed_points, {"action_id": "like.test%"}
    )
    supabase_client.db.delete_by(
        supabase_names.tables.action_definition, {"action_id": "like.test%"}
    )

    supabase_client.db.delete_by(supabase_names.tables.question, {"id": "like.test%"})
    supabase_client.db.delete_by(
        supabase_names.tables.question_choix, {"question_id": "like.test%"}
    )
    supabase_client.db.delete_by(
        supabase_names.tables.question_action, {"question_id": "like.test%"}
    )

    supabase_client.db.delete_by(
        supabase_names.tables.personnalisation_regle, {"action_id": "like.test%"}
    )
    supabase_client.db.delete_by(supabase_names.tables.personnalisation_consequence, {})

    supabase_client.db.delete_by(
        supabase_names.tables.personnalisation, {"action_id": "like.test%"}
    )
    supabase_client.db.delete_by(
        supabase_names.tables.action_relation, {"id": "like.test%"}
    )
    supabase_client.db.delete_by(
        supabase_names.tables.action_relation, {"parent": "like.test%"}
    )
    supabase_client.db.delete_by(
        supabase_names.tables.preuve_definition, {"id": "like.test%"}
    )


@pytest.fixture()
def supabase_referentiel_repo(supabase_client):
    yield SupabaseReferentielRepository(supabase_client)
    reset_supabase_client(supabase_client)
