import pytest

from business.evaluation.adapters.postgres_action_score_repo import (
    PostgresActionScoreRepository,
)
from business.utils.postgres_repo import PostgresRepositoryError
from business.utils.action_id import ActionId
from tests.utils.score_factory import make_action_score
from tests.utils.postgres_fixtures import *
from .cursor_executions import insert_epci, insert_referentiel


def test_cannot_write_if_epci_or_action_does_not_exist(postgres_connection):
    repo = PostgresActionScoreRepository(postgres_connection)
    with pytest.raises(PostgresRepositoryError):
        repo.add_entities_for_epci(
            epci_id=1, entities=[make_action_score("cae", points=50)]
        )


def test_adding_entities_for_different_epcis_to_repo_should_write_in_postgres(
    postgres_connection,
):
    # test_cursor = autoclear_cursor
    test_cursor = postgres_connection.cursor(row_factory=dict_row)
    insert_referentiel(
        test_cursor,
        "cae",
        {
            ActionId("cae"): None,
            ActionId("cae_1"): ActionId("cae"),
            ActionId("cae_1.1"): ActionId("cae_1"),
            ActionId("cae_2"): ActionId("cae"),
        },
    )
    insert_epci(test_cursor, 1)
    insert_epci(test_cursor, 2)

    repo = PostgresActionScoreRepository(postgres_connection)

    # add and retrieve a score for action "cae" on epci #1
    repo.add_entities_for_epci(
        epci_id=1, entities=[make_action_score("cae", points=50)]
    )
    test_cursor.execute("select action_id from score where epci_id=1;")

    epci_1_action_id_with_scores = test_cursor.fetchall()
    assert len(epci_1_action_id_with_scores) == 1
    assert epci_1_action_id_with_scores == [{"action_id": "cae"}]

    # add and retrieve a score for action "cae_1.1" on epci #2
    repo.add_entities_for_epci(
        epci_id=2, entities=[make_action_score("cae_1.1", points=90)]
    )
    test_cursor.execute("select action_id from score where epci_id=2;")
    epci_1_action_id_with_scores = test_cursor.fetchall()
    assert len(epci_1_action_id_with_scores) == 1
    assert epci_1_action_id_with_scores == [{"action_id": "cae_1.1"}]
