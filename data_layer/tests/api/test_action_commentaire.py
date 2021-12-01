import supabase

from tests.utils.prepare_cursor import prepare_cursor
from tests.utils.sql_factories import *


def test_authentified_user_can_insert_action_commentaire(
    cursor,
    supabase_client: supabase.Client,
):
    supabase_client.auth.sign_up(email="la@la.com", password="password")
    supabase_client.auth.sign_in(email="la@la.com", password="password")

    prepare_cursor(cursor, make_sql_to_insert_action_relation(action_id="cae_1.2.3"))

    data = (
        supabase_client.table("action_commentaire")
        .insert(
            {
                "epci_id": 1,
                "commentaire": "un commentaire",
                "action_id": "cae_1.2.3",
                # "modified_by": supabase_client.auth.user()["id"],
            }
        )
        .execute()
    )

    assert data.get("data", {})["status_code"] == 201
    cursor.execute("select * from action_commentaire;")
    all_action_commentaires = cursor.fetchall()
    assert len(all_action_commentaires) == 1
    last_action_commentaire = all_action_commentaires[-1]
    last_action_commentaire["action_id"] == "cae_1.2.3"
    last_action_commentaire["commentaire"] == "un commentaire"


def test_anyone_can_retrieve_action_commentaire(supabase_client, cursor):
    user_uid = "a1dd4a56-d0c8-4b1e-b3b5-5e7e982df3a8"
    prepare_cursor(
        cursor,
        make_sql_insert_user(user_uid=user_uid)
        + make_sql_to_insert_action_relation(action_id="cae_1.2.3")
        + make_sql_insert_action_commentaire(
            user_uid=user_uid, commentaire="lala", action_id="cae_1.2.3"
        ),
    )

    response = supabase_client.from_("action_commentaire").select("*").execute()
    assert response["status_code"] == 200
    assert len(response["data"]) == 1
    assert response["data"][0]["modified_by"] == user_uid
