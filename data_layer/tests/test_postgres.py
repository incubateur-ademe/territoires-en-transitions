import pytest


@pytest.fixture()
def initialized_cursor(postgres_connection, request):
    cursor = postgres_connection.cursor()
    development = open("postgres/development.sql", "r").read()
    cursor.execute(development)
    request.addfinalizer(cursor.close)

    return cursor


def test_postgres_should_not_have_any_public_tables(postgres_connection):
    with postgres_connection.cursor() as cursor:
        list_tables = open("tests/postgres/list_public_tables.sql", "r").read()
        cursor.execute(list_tables)

        table_names = cursor.fetchall()
        assert len(table_names) == 0


def test_postgres_setup_should_create_tables(initialized_cursor):
    list_tables = open("tests/postgres/list_public_tables.sql", "r").read()
    initialized_cursor.execute(list_tables)

    table_names = initialized_cursor.fetchall()
    assert len(table_names) > 0


def test_epci_insertion_should_update_table_and_view(initialized_cursor):
    insert_epci = open("tests/postgres/insert_fake_epcis.sql", "r").read()
    initialized_cursor.execute(insert_epci)

    initialized_cursor.execute("select * from epci;")
    epcis = initialized_cursor.fetchall()

    assert len(epcis) > 0

    initialized_cursor.execute("select * from client_epci;")
    client_epcis = initialized_cursor.fetchall()

    assert len(client_epcis) > 0


def test_referentiel_should_update_table_and_view(initialized_cursor):
    insert_referentiel = open("tests/postgres/insert_fake_referentiel.sql", "r").read()
    initialized_cursor.execute(insert_referentiel)

    initialized_cursor.execute("select * from action_relation;")
    relations = initialized_cursor.fetchall()

    assert len(relations) > 0

    initialized_cursor.execute("select * from action_children;")
    children = initialized_cursor.fetchall()

    assert len(children) == len(relations)
    for child in children:
        print(child)

