from business.evaluation.adapters.postgres_action_statut_repo import (
    PostgresActionStatutRepository,
)
from business.utils.action_id import ActionId
from tests.utils.postgres_fixtures import *
from .cursor_executions import (
    # insert_epci,
    insert_referentiel,
    insert_action_statut_for_collectivite,
)


def test_can_get_all_actions_of_a_referentiel_for_epci(
    postgres_connection, autoclear_cursor
):
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
    repo = PostgresActionStatutRepository(postgres_connection)

    # One statut for referentiel CAE for EPCI #1
    all_statuts_cae_of_epci_1 = repo.get_all_for_collectivite(
        collectivite_id=1, referentiel="cae"
    )
    assert len(all_statuts_cae_of_epci_1) == 1
    assert all_statuts_cae_of_epci_1[0].action_id == ActionId("cae_1")

    # No statut for referentiel CAE for EPCI #2
    all_statuts_cae_of_epci_2 = repo.get_all_for_collectivite(
        collectivite_id=2, referentiel="cae"
    )
    assert len(all_statuts_cae_of_epci_2) == 0

    # No statut for referentiel ECI for EPCI #1
    all_statuts_cae_of_epci_1 = repo.get_all_for_collectivite(
        collectivite_id=1, referentiel="eci"
    )
    assert len(all_statuts_cae_of_epci_1) == 0
