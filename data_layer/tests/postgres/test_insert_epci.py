from tests.utils.sql_factories import make_sql_insert_epci


def test_epci_insertion_should_update_table_and_view(cursor):
    insert_epci = make_sql_insert_epci()
    cursor.execute(insert_epci)

    cursor.execute("select * from epci;")
    epcis = cursor.fetchall()

    assert len(epcis) == 1

    cursor.execute("select * from all_collectivites;")
    client_epcis = cursor.fetchall()

    assert len(client_epcis) == 1
