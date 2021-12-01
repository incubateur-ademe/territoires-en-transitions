import uuid

import pytest
import supabase

from tests.utils.prepare_cursor import prepare_cursor
from tests.utils.sql_factories import *


def test_insert_action_relation_should_update_table_and_view(cursor):
    # insert action relations
    cursor.execute(
        make_sql_to_insert_action_relation("cae", "cae", None)  # insert root cae
        + make_sql_to_insert_action_relation("cae", "cae_1", "cae")  # insert axis cae_1
        + make_sql_to_insert_action_relation("cae", "cae_2", "cae")  # insert axis cae_2
    )
    # retrieve action relations
    cursor.execute("select * from action_relation;")
    relations = cursor.fetchall()
    assert len(relations) == 3
    assert relations == [
        {"id": "cae", "referentiel": "cae", "parent": None},
        {"id": "cae_1", "referentiel": "cae", "parent": "cae"},
        {"id": "cae_2", "referentiel": "cae", "parent": "cae"},
    ]

    # check action_children view is correct
    cursor.execute("select * from action_children;")
    children = cursor.fetchall()

    assert len(children) == 3
    assert children == [
        {
            "referentiel": "cae",
            "id": "cae",
            "parent": None,
            "children": "{cae_1,cae_2}",
        },
        {"referentiel": "cae", "id": "cae_1", "parent": "cae", "children": None},
        {"referentiel": "cae", "id": "cae_2", "parent": "cae", "children": None},
    ]


def test_can_insert_and_retrieve_action_commentaire(
    cursor,
    supabase_client: supabase.Client,
):
    supabase_client.auth.sign_up(email="la@la", password="password")

    prepare_cursor(cursor, make_sql_to_insert_action_relation(action_id="cae_1.2.3"))

    insert_commentaire = """
        insert into action_commentaire(epci_id, action_id, commentaire)
        values (1, 'cae_1.2.3' , 'un commentaire')
    """

    cursor.execute(insert_commentaire)
    cursor.execute(
        "select * from action_commentaire where modified_by='17440546-f389-4d4f-bfdb-b0c94a1bd0f9';"
    )
    all_action_commentaires = cursor.fetchall()
    assert len(all_action_commentaires) == 1
    last_action_commentaire = all_action_commentaires[-1]
    last_action_commentaire["action_id"] == "cae_1.2.3"
    last_action_commentaire["commentaire"] == "un commentaire"


def test_can_insert_and_retrieve_commentaire_from_authentified_user(
    cursor, supabase_client
):
    # user1 is connected but tries to insert modified_by with uuid of user2
    user1_uid = str(uuid.uuid4())
    user2_uid = str(uuid.uuid4())
    cursor.execute(make_sql_insert_user(email="user1@gmail.com", user_uid=user1_uid))
    cursor.execute(make_sql_insert_user(email="user2@gmail.com", user_uid=user2_uid))

    supabase_client.auth.sign_in("user1@gmail.com", "yolododo")

    with pytest.raises(Exception):
        cursor.execute(make_sql_insert_action_commentaire(user_uid=user2_uid))


def test_cannot_insert_commentaire_if_modified_by_different_from_auth_user(
    cursor, supabase_client
):
    # user1 is connected but tries to insert modified_by with uuid of user2
    user1_uid = str(uuid.uuid4())
    user2_uid = str(uuid.uuid4())
    cursor.execute(make_sql_insert_user(email="user1@gmail.com", user_uid=user1_uid))
    cursor.execute(make_sql_insert_user(email="user2@gmail.com", user_uid=user2_uid))

    supabase_client.auth.sign_in("user1@gmail.com", "yolododo")

    with pytest.raises(Exception):
        cursor.execute(make_sql_insert_action_commentaire(user_uid=user2_uid))
