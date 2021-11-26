import psycopg
import pytest

from business.utils.get_postgres_connection_params import get_postgres_connection_params

test_postgres_url = f"postgresql://postgres:your-supe¨r-secret-and-long-postgres-password@localhost:50001/postgres"  # NB : port 50001 should be specified in docker-compose variables !


@pytest.fixture()
def postgres_connection() -> psycopg.Connection:
    connection = psycopg.connect(**get_postgres_connection_params(test_postgres_url))
    _initialize_tables(connection)
    return connection


def _initialize_tables(postgres_connection):
    development = open("../data_layer/postgres/development.sql", "r").read()
    with postgres_connection.cursor() as cursor:
        cursor.execute(development)
