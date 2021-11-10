import psycopg
from psycopg import connection
import pytest
from urllib.parse import urlparse


postgres_url = f"postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:50001/postgres"  # NB : port 50001 should be specified in docker-compose variables !


def get_postgres_connection_params() -> dict:
    db_params = urlparse(postgres_url)

    return dict(
        dbname=db_params.path[1:],
        user=db_params.username,
        password=db_params.password,
        host=db_params.hostname,
        port=db_params.port,
    )


@pytest.fixture()
def postgres_connection() -> psycopg.Connection:
    connection = psycopg.connect(**get_postgres_connection_params())
    _initialize_tables(connection)
    return connection


def _initialize_tables(postgres_connection):
    development = open("../data_layer/postgres/development.sql", "r").read()
    with postgres_connection.cursor() as cursor:
        cursor.execute(development)
