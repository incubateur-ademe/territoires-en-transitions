import pytest

from business.adapters.postgres.postgres_action_statut_repo import (
    PostgresActionStatutRepository,
)
from business.adapters.postgres.postgres_repo import PostgresRepositoryError
from business.utils.action_id import ActionId
from .fixtures import *
from .helpers import insert_epci, insert_fake_referentiel


def test_cannot_request_if_epci_does_not_exist(initialized_cursor):
    repo = PostgresActionStatutRepository(initialized_cursor)
    with pytest.raises(PostgresRepositoryError):
        repo.get_all_for_epci(epci_id=1, referentiel="eci")


def test_can_get_all_actions_of_a_referentiel_for_epci(
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

    # insert statut for action cae_1

    repo = PostgresActionStatutRepository(initialized_cursor)

    # add and retrieve a score for action "cae" on epci #1
    all_statuts_of_epci_1 = repo.get_all_for_epci(epci_id=1, referentiel="eci")

    assert len(all_statuts_of_epci_1) == 1
