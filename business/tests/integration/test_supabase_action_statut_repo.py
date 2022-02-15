from business.evaluation.adapters import supabase_names
from business.evaluation.adapters.supabase_action_statut_repo import (
    SupabaseActionStatutRepository,
)
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
    ActionStatutAvancement,
)
from business.utils.action_id import ActionId
from tests.utils.supabase_fixtures import *


@pytest.fixture()
def supabase_repo(supabase_client: SupabaseClient) -> SupabaseActionStatutRepository:
    return SupabaseActionStatutRepository(supabase_client)


def test_can_get_all_actions_of_a_referentiel_for_epci(supabase_repo):

    # One statut for referentiel CAE for EPCI #1
    all_statuts_cae_of_epci_1 = supabase_repo.get_all_for_collectivite(
        collectivite_id=1, referentiel="cae"
    )
    assert all_statuts_cae_of_epci_1 == [
        ActionStatut(
            action_id=ActionId("cae_1.1.1.1.1"),
            avancement=ActionStatutAvancement.FAIT,
            concerne=True,
        )
    ]
    # No statut for referentiel ECI for EPCI #1
    all_statuts_cae_of_epci_1 = supabase_repo.get_all_for_collectivite(
        collectivite_id=1, referentiel="eci"
    )
    assert len(all_statuts_cae_of_epci_1) == 0

    # No statut for referentiel CAE for EPCI #10
    all_statuts_cae_of_epci_10 = supabase_repo.get_all_for_collectivite(
        collectivite_id=10, referentiel="cae"
    )
    assert len(all_statuts_cae_of_epci_10) == 0
