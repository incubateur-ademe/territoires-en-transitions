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
    insert_epci = open("tests/postgres/11-insert_fake_epcis.sql", "r").read()
    insert_epci = """
        insert into
        action_statut(epci_id, action_id, avancement, concerne, modified_by)
        values (1, 'cae_1', 'fait', true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9');
    """
    initialized_cursor.execute(insert_epci)

    initialized_cursor.execute("select * from epci;")
    epcis = initialized_cursor.fetchall()

    assert len(epcis) > 0

    initialized_cursor.execute("select * from client_epci;")
    client_epcis = initialized_cursor.fetchall()

    assert len(client_epcis) > 0


def test_referentiel_should_update_table_and_view(initialized_cursor):
    insert_referentiel = open(
        "tests/postgres/12-insert_fake_referentiel.sql", "r"
    ).read()
    initialized_cursor.execute(insert_referentiel)

    initialized_cursor.execute("select * from action_relation;")
    relations = initialized_cursor.fetchall()

    assert len(relations) > 0

    initialized_cursor.execute("select * from action_children;")
    children = initialized_cursor.fetchall()

    assert len(children) == len(relations)
    for child in children:
        print(child)


def test_can_insert_and_retrieve_action_commentaire(postgres_connection):
    with postgres_connection.cursor() as cursor:
        insert_commentaire = """
        insert into action_commentaire(epci_id, action_id, commentaire, modified_by)
        values (1, 'cae_1.2.3' , 'un commentaire', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')
        """
        cursor.execute(insert_commentaire)
        cursor.execute(
            "select * from action_commentaire where modified_by='17440546-f389-4d4f-bfdb-b0c94a1bd0f9';"
        )
        all_action_commentaires = cursor.fetchall()
        assert len(all_action_commentaires) == 1
        assert all_action_commentaires[-1][1:4] == (
            1,
            "cae_1.2.3",
            "un commentaire",
        )
