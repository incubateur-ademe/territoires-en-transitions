import supabase

from tests.utils.prepare_cursor import prepare_cursor
from tests.utils.sql_factories import *
from .action_scenarios import MakeActionApiScenario


def test_authentified_user_can_insert_action_statut(
    cursor,
    supabase_client: supabase.Client,
):
    make_action_api_scenario = MakeActionApiScenario(
        cursor=cursor,
        supabase_client=supabase_client,
        action_id="cae_1.2.3",
        table_name="action_statut",
    )
    make_action_api_scenario.assert_authentified_user_can_insert_entity(
        {
            "collectivite_id": 1,
            "avancement": "programme",
            "concerne": False,
            "action_id": "cae_1.2.3",
        }
    )


def test_cannot_insert_action_statut_with_wrong_user_uid(
    cursor,
    supabase_client: supabase.Client,
):
    wrong_user_uid = "a1dd4a56-d0c8-4b1e-b3b5-5e7e982df3a8"
    make_action_api_scenario = MakeActionApiScenario(
        cursor=cursor,
        supabase_client=supabase_client,
        action_id="cae_1.2.3",
        table_name="action_statut",
    )
    make_action_api_scenario.assert_cannot_insert_entity_with_wrong_user_uid(
        entity={
            "collectivite_id": 1,
            "avancement": "programme",
            "concerne": False,
            "action_id": "cae_1.2.3",
            "modified_by": wrong_user_uid,
        },
        wrong_user_uid=wrong_user_uid,
    )


def test_anyone_can_retrieve_action_statut(supabase_client, cursor):
    editor_uid = "a1dd4a56-d0c8-4b1e-b3b5-5e7e982df3a8"
    make_action_api_scenario = MakeActionApiScenario(
        cursor=cursor,
        supabase_client=supabase_client,
        action_id="cae_1.2.3",
        table_name="action_statut",
    )
    make_action_api_scenario.assert_anyone_can_retrieve_entity(
        insertion_sql=make_sql_insert_action_statut(
            user_uid=editor_uid, action_id="cae_1.2.3"
        ),
        editor_uid=editor_uid,
    )
