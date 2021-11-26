import psycopg
from psycopg.rows import dict_row
import pytest

from business.utils.get_postgres_connection_params import get_postgres_connection_params

test_postgres_url = f"postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:50001/postgres"  # NB : port 50001 should be specified in docker-compose variables !


@pytest.fixture()
def postgres_connection() -> psycopg.Connection:
    connection = psycopg.connect(**get_postgres_connection_params(test_postgres_url))
    return connection


@pytest.fixture()
def cursor(postgres_connection: psycopg.Connection, request):
    cursor = postgres_connection.cursor(row_factory=dict_row)
    request.addfinalizer(cursor.close)
    return cursor


def clear_cursor(cursor: psycopg.Cursor):
    try:
        tables = ["score, action_relation"]
        cursor.execute(f"""TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE""")
        cursor.connection.commit()
    except psycopg.errors.ObjectInUse as e:
        pass
        print(e)
        # TODO !


@pytest.fixture()
def autoclear_cursor(cursor, request):
    clear_cursor(cursor)

    def clear_and_close_cursor():
        clear_cursor(cursor)
        cursor.close()

    request.addfinalizer(clear_and_close_cursor)
    return cursor


# @pytest.fixture()
# def postgres_connection() -> psycopg.Connection:
#     connection = psycopg.connect(**get_postgres_connection_params(test_postgres_url))
#     _initialize_tables(connection)
#     return connection


# def _initialize_tables(postgres_connection):
#     development = open("../data_layer/postgres/development.sql", "r").read()
#     with postgres_connection.cursor() as cursor:
#         cursor.execute(development)
