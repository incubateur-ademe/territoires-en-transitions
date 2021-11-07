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


def test_adding_entities_to_repo_should_write_in_postgres(initialized_cursor):
    insert_referentiel = open(
        "../data_layer/postgres/tests/insert_fake_referentiel.sql", "r"
    ).read()
    initialized_cursor.execute(insert_referentiel)
    repo = PostgresActionScoreRepository(initialized_cursor)
    repo.add_entities_for_epci(epci_id=1, entities=[make_action_score("cae")])

    initialized_cursor.execute("select * from score;")
    scores = initialized_cursor.fetchall()
    assert len(scores) == 1
