def skip_test_postgres_should_not_have_any_public_tables_before_initialization(
    postgres_connection,
):
    with postgres_connection.cursor() as cursor:
        sql = """
                SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
              """
        cursor.execute(sql)

        table_names = cursor.fetchall()
        assert len(table_names) == 0


def test_postgres_setup_should_create_all_tables(cursor):
    list_tables = """
                  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
                  """
    cursor.execute(list_tables)

    table_names = cursor.fetchall()

    assert set([table["table_name"] for table in table_names]) >= {
        "client_epci",
        "action_relation",
        "action_children",
        "epci",
        # "client_action_statut",
        # "business_action_statut",
        # "client_scores",
        "action_commentaire",
        # "epci_action_statut_update_event",
        # "unprocessed_epci_action_statut_update_event",
        # "action_statut",
        # "action_statut_log",
        # "score",
        # "score_log",
        "table_as_json_typedef",
    }


def test_epci_insertion_should_update_table_and_view(cursor):
    insert_epci = """
    insert into epci values (default, '12345678901234', 'Yolo', default, default);
    """
    cursor.execute(insert_epci)

    cursor.execute("select * from epci;")
    epcis = cursor.fetchall()

    assert len(epcis) == 1

    cursor.execute("select * from all_collectivite;")
    client_epcis = cursor.fetchall()

    assert len(client_epcis) == 1
