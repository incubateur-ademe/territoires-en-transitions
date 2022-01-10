from business.evaluation.adapters.postgres_action_statut_update_event_repo import (
    PostgresActionStatutUpdateEventRepository,
)
from business.utils.action_id import ActionId
from tests.utils.postgres_fixtures import *
from .cursor_executions import (
    insert_referentiel,
    insert_action_statut_for_collectivite,
)


def test_can_get_unprocessed_events(postgres_connection, autoclear_cursor):
    test_cursor = autoclear_cursor
    insert_referentiel(
        test_cursor,
        "cae",
        {
            ActionId("cae"): None,
            ActionId("cae_1"): ActionId("cae"),
            ActionId("cae_2"): ActionId("cae"),
        },
    )
    # insert_epci(test_cursor, 1)
    insert_action_statut_for_collectivite(
        test_cursor, collectivite_id=1, action_id="cae_1"
    )

    # add and retrieve a score for action "cae_1" of CAE referentiel on EPCI #1
    repo = PostgresActionStatutUpdateEventRepository(postgres_connection)

    # One statut is unprocessed
    actual_unprocessed_events = repo.get_unprocessed_events()
    assert len(actual_unprocessed_events) == 1
    assert actual_unprocessed_events[0].collectivite_id == 1
    assert actual_unprocessed_events[0].referentiel == "cae"
