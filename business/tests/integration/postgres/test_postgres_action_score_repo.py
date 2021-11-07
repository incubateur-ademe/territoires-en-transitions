from typing import Dict, Optional
from urllib.parse import urlparse

import psycopg
from psycopg import Connection, Cursor
import pytest

from business.adapters.postgres.postgres_action_score_repo import (
    PostgresActionScoreRepository,
)
from business.utils.action_id import ActionId, Referentiel
from tests.utils.score_factory import make_action_score

postgres_url = f"postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:49154/postgres"


@pytest.fixture()
def postgres_connection_params() -> dict:
    db_params = urlparse(postgres_url)

    return dict(
        dbname=db_params.path[1:],
        user=db_params.username,
        password=db_params.password,
        host=db_params.hostname,
        port=db_params.port,
    )


@pytest.fixture()
def postgres_connection(postgres_connection_params) -> Connection:
    return psycopg.connect(**postgres_connection_params)


@pytest.fixture()
def initialized_cursor(postgres_connection, request):
    cursor = postgres_connection.cursor()
    development = open("../data_layer/postgres/development.sql", "r").read()
    cursor.execute(development)
    request.addfinalizer(cursor.close)

    return cursor


# SQL tests helpers
# -----------------
def insert_action_relation(
    cursor: Cursor,
    referentiel: Referentiel,
    action_id: ActionId,
    parent_id: Optional[ActionId],
):
    cursor.execute(
        "insert into action_relation values (%(action_id)s, %(referentiel)s, %(parent_id)s);",
        {
            "action_id": action_id,
            "referentiel": referentiel,
            "parent_id": parent_id,
        },
    )


def insert_first_epci(cursor: Cursor):
    # cur.execute("""
    #     INSERT INTO some_table (an_int, a_date, another_date, a_string)
    #     VALUES (%(int)s, %(date)s, %(date)s, %(str)s);
    #     """,
    #             {'int': 10, 'str': "O'Reilly", 'date': datetime.date(2020, 11, 18)})

    sql = f"insert into epci values (1, '12345678901234', 'Yolo', default, default);"
    cursor.execute(sql)


def insert_fake_referentiel(
    cursor: Cursor,
    referentiel: Referentiel,
    parent_by_action_id: Dict[ActionId, Optional[ActionId]],
):
    for action_id, parent_action_id in parent_by_action_id.items():
        insert_action_relation(cursor, referentiel, action_id, parent_action_id)


def test_adding_entities_to_repo_should_write_in_postgres(initialized_cursor):
    insert_fake_referentiel(
        initialized_cursor,
        "cae",
        {
            ActionId("cae"): None,
            ActionId("cae_1"): ActionId("cae"),
            ActionId("cae_2"): ActionId("cae"),
        },
    )
    insert_first_epci(initialized_cursor)

    repo = PostgresActionScoreRepository(initialized_cursor)
    repo.add_entities_for_epci(epci_id=1, entities=[make_action_score("cae")])

    initialized_cursor.execute("select * from score;")
    scores = initialized_cursor.fetchall()
    assert len(scores) == 1
