import pytest

from business.evaluation.adapters.postgres_action_score_repo import (
    PostgresActionScoreRepository,
)
from business.utils.postgres_repo import PostgresRepositoryError
from business.utils.action_id import ActionId
from tests.utils.score_factory import make_action_score
from tests.utils.postgres_fixtures import *
from .cursor_executions import insert_referentiel  # insert_epci


def test_cannot_write_if_collectivite_or_action_does_not_exist(postgres_connection):
    repo = PostgresActionScoreRepository(postgres_connection)
    with pytest.raises(PostgresRepositoryError):
        repo.add_entities_for_collectivite(
            collectivite_id=10000, entities=[make_action_score("cae", points=50)]
        )


def test_adding_and_updating_entities_for_different_collectivites_to_repo_should_write_in_postgres(
    postgres_connection, autoclear_cursor
):
    test_cursor = autoclear_cursor
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

    repo = PostgresActionScoreRepository(postgres_connection)

    # add and retrieve a score for action "cae" on epci #1
    repo.add_entities_for_collectivite(
        collectivite_id=1, entities=[make_action_score("cae", points=50)]
    )
    test_cursor.execute("select action_id from score where collectivite_id=1;")

    collectivite_1_action_id_with_scores = test_cursor.fetchall()
    assert len(collectivite_1_action_id_with_scores) == 1
    assert collectivite_1_action_id_with_scores == [{"action_id": "cae"}]

    # add and retrieve a score for action "cae_1.1" on collectivite #2
    repo.add_entities_for_collectivite(
        collectivite_id=2, entities=[make_action_score("cae_1.1", points=90)]
    )
    test_cursor.execute("select action_id, points from score where collectivite_id=2;")
    collectivite_1_action_id_with_scores = test_cursor.fetchall()
    assert len(collectivite_1_action_id_with_scores) == 1
    assert collectivite_1_action_id_with_scores == [
        {"action_id": "cae_1.1", "points": 90}
    ]

    # update score for cae_1.1
    repo.add_entities_for_collectivite(
        collectivite_id=2, entities=[make_action_score("cae_1.1", points=95)]
    )
    test_cursor.execute("select action_id, points from score where collectivite_id=2;")
    collectivite_1_action_id_with_scores = test_cursor.fetchall()
    assert len(collectivite_1_action_id_with_scores) == 1
    assert collectivite_1_action_id_with_scores == [
        {"action_id": "cae_1.1", "points": 95}
    ]
