from business.evaluation.adapters.supabase_action_statut_update_event_repo import (
    SupabaseActionStatutUpdateEventRepository,
)
from tests.utils.supabase_fixtures import *
from business.evaluation.adapters import supabase_table_names


@pytest.fixture()
def supabase_repo(supabase_client) -> SupabaseActionStatutUpdateEventRepository:
    return SupabaseActionStatutUpdateEventRepository(supabase_client)


def skip_test_can_get_unprocessed_events(supabase_repo):
    # TODO : insert an action_statut row ==> unfortunately, violates row level security ... :(
    # supabase_client.table("action_statut").insert(
    #     {
    #         "collectivite_id": "12",
    #         "action_id": "cae_1.1.1",
    #         "avancement": "fait",
    #     }
    # ).execute()

    # Retrieve unprocessed referentiel and collectivite with unprocessed data (see fake data)
    actual_unprocessed_events = supabase_repo.get_unprocessed_events()
    assert len(actual_unprocessed_events) == 1
    assert actual_unprocessed_events[0].collectivite_id == 1
    assert actual_unprocessed_events[0].referentiel == "cae"
