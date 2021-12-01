import supabase

from tests.utils.prepare_cursor import prepare_cursor
from tests.utils.sql_factories import *


def test_authentified_user_can_insert_action_commentaire(
    cursor,
    supabase_client: supabase.Client,
):
    supabase_client.auth.sign_up(email="la@la", password="password")
    supabase_client.auth.sign_in(email="la@la", password="password")

    prepare_cursor(cursor, make_sql_to_insert_action_relation(action_id="cae_1.2.3"))

    data = (
        supabase_client.table("action_commentaire")
        .insert(
            {"epci_id": 1, "commentaire": "un commentaire", "action_id": "cae_1.2.3"}
        )
        .execute()
    )
    assert len(data.get("data", [])) > 0
    cursor.execute("select * from action_commentaire;")
    all_action_commentaires = cursor.fetchall()
    assert len(all_action_commentaires) == 1
    last_action_commentaire = all_action_commentaires[-1]
    last_action_commentaire["action_id"] == "cae_1.2.3"
    last_action_commentaire["commentaire"] == "un commentaire"


def test_anyone_can_retrieve_action_commentaire():
    pass
