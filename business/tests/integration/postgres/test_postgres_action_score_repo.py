import pytest

from business.adapters.postgres.postgres_action_score_repo import (
    PostgresActionScoreRepository,
)
from business.adapters.postgres.postgres_repo import PostgresRepositoryError
from business.utils.action_id import ActionId
from tests.utils.score_factory import make_action_score
from .fixtures import *
from .helpers import insert_epci, insert_fake_referentiel


def test_cannot_write_if_epci_or_action_does_not_exist(initialized_cursor):
    repo = PostgresActionScoreRepository(initialized_cursor)
    with pytest.raises(PostgresRepositoryError):
        repo.add_entities_for_epci(
            epci_id=1, entities=[make_action_score("cae", points=50)]
        )


def test_adding_entities_for_different_epcis_to_repo_should_write_in_postgres(
    initialized_cursor,
):
    insert_fake_referentiel(
        initialized_cursor,
        "cae",
        {
            ActionId("cae"): None,
            ActionId("cae_1"): ActionId("cae"),
            ActionId("cae_2"): ActionId("cae"),
        },
    )
    insert_epci(initialized_cursor, 1)
    insert_epci(initialized_cursor, 2)

    repo = PostgresActionScoreRepository(initialized_cursor)

    # add and retrieve a score for action "cae" on epci #1
    repo.add_entities_for_epci(
        epci_id=1, entities=[make_action_score("cae", points=50)]
    )
    initialized_cursor.execute("select action_id from score where epci_id=1;")
    epci_1_action_id_with_scores = initialized_cursor.fetchall()
    assert len(epci_1_action_id_with_scores) == 1
    assert epci_1_action_id_with_scores == [("cae",)]

    # add and retrieve a score for action "eci_1.1" on epci #2
    repo.add_entities_for_epci(
        epci_id=2, entities=[make_action_score("eci_1.1", points=90)]
    )
    initialized_cursor.execute("select action_id from score where epci_id=2;")
    epci_1_action_id_with_scores = initialized_cursor.fetchall()
    assert len(epci_1_action_id_with_scores) == 1
    assert epci_1_action_id_with_scores == [("eci_1.1",)]
