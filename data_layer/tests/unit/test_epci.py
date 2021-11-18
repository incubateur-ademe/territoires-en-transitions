def test_epci_insertion_should_update_table_and_view(initialized_cursor):
    insert_epci = """
    insert into epci values (default, '12345678901234', 'Yolo', default, default);
    """
    initialized_cursor.execute(insert_epci)

    initialized_cursor.execute("select * from epci;")
    epcis = initialized_cursor.fetchall()

    assert len(epcis) == 1

    initialized_cursor.execute("select * from client_epci;")
    client_epcis = initialized_cursor.fetchall()

    assert len(client_epcis) == 1
