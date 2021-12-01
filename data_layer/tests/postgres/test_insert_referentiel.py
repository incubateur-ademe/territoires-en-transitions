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
