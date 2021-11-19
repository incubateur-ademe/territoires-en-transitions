from tests.utils.prepare_cursor import prepare_cursor
from tests.utils.sql_factories import (
    make_sql_insert_epci,
    make_sql_insert_score,
    make_sql_to_insert_action_relation,
)


def test_insert_score_triggers_an_update_of_table_client_score(
    autoclear_cursor,
):
    cursor = autoclear_cursor
    # 1. insert scores
    prepare_cursor(
        cursor,
        make_sql_insert_epci()
        + make_sql_to_insert_action_relation(action_id="cae_1")
        + make_sql_to_insert_action_relation(action_id="cae_2"),
    )
    cursor.execute(
        make_sql_insert_score(action_id="cae_1", created_at="2021-01-01")
        + make_sql_insert_score(action_id="cae_2", created_at="2021-01-01")
    )

    # commit !
    cursor.connection.commit()

    # 2. check get_score_batches_for_epci
    cursor.execute("""SELECT * FROM get_score_batches_for_epci(1);""")
    score_batches_for_epci_1 = cursor.fetchall()
    assert len(score_batches_for_epci_1) == 1

    # 3. only 1 row should be returned  todo !!
    cursor.execute("""SELECT * FROM client_scores WHERE epci_id=1;""")

    client_scores = cursor.fetchall()
    assert len(client_scores) == 1

    # 4. there should be no client scores to compute.
    cursor.execute(
        """SELECT * FROM should_create_client_scores_for_epci(1, '2021-01-01'::timestamptz);"""
    )
    should_create_client_scores_for_epci = cursor.fetchall()
    assert len(should_create_client_scores_for_epci) == 1
    should_create_client_scores_for_epci[0] == False
