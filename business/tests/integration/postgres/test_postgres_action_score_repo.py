from typing import Dict, Optional
from urllib.parse import urlparse

import psycopg
from psycopg import Connection, Cursor
import pytest

from business.adapters.postgres.postgres_action_score_repo import (
    PostgresActionScoreRepository,
)
from business.adapters.postgres.postgres_repo import PostgresRepositoryError
from business.utils.action_id import ActionId, Referentiel
from tests.utils.score_factory import make_action_score

postgres_url = f"postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:50001/postgres"


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


def insert_epci(cursor: Cursor, epci_id: int):

    sql = f"insert into epci values ({epci_id}, '12345678901234', 'Yolo', default, default);"
    cursor.execute(sql)


def insert_fake_referentiel(
    cursor: Cursor,
    referentiel: Referentiel,
    parent_by_action_id: Dict[ActionId, Optional[ActionId]],
):
    for action_id, parent_action_id in parent_by_action_id.items():
        insert_action_relation(cursor, referentiel, action_id, parent_action_id)


def test_cannot_write_if_epci_or_action_does_not_exist(initialized_cursor):
    repo = PostgresActionScoreRepository(initialized_cursor)
    with pytest.raises(PostgresRepositoryError):
        repo.add_entities_for_epci(
            epci_id=1, entities=[make_action_score("cae", points=50)]
        )


def test_adding_entities_for_different_epcis_to_repo_should_write_in_postgres(
    initialized_cursor,
):
    insert_fake_referentiel(
        initialized_cursor,
        "cae",
        {
            ActionId("cae"): None,
            ActionId("cae_1"): ActionId("cae"),
            ActionId("cae_2"): ActionId("cae"),
        },
    )
    insert_epci(initialized_cursor, 1)
    insert_epci(initialized_cursor, 2)

    repo = PostgresActionScoreRepository(initialized_cursor)

    # add and retrieve a score for action "cae" on epci #1
    repo.add_entities_for_epci(
        epci_id=1, entities=[make_action_score("cae", points=50)]
    )
    initialized_cursor.execute("select action_id from score where epci_id=1;")
    epci_1_action_id_with_scores = initialized_cursor.fetchall()
    assert len(epci_1_action_id_with_scores) == 1
    assert epci_1_action_id_with_scores == [("cae",)]

    # add and retrieve a score for action "eci_1.1" on epci #2
    repo.add_entities_for_epci(
        epci_id=2, entities=[make_action_score("eci_1.1", points=90)]
    )
    initialized_cursor.execute("select action_id from score where epci_id=2;")
    epci_1_action_id_with_scores = initialized_cursor.fetchall()
    assert len(epci_1_action_id_with_scores) == 1
    assert epci_1_action_id_with_scores == [("eci_1.1",)]
