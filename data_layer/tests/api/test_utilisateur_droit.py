import pytest
import supabase

from tests.utils.supabase import supabase_rpc_as_user, supabase_query_as_user

fake_user_id = "17440546-f389-4d4f-bfdb-b0c94a1bd0f9"
bugey_epci_siren = "200042935"
bugey_epci_nom = "Haut - Bugey Agglomération"
beb_epci_siren = "200071751"
beb_epci_nom = "CA du Bassin de Bourg-en-Bresse"


@pytest.mark.asyncio
async def test_claim_epci_ok_for_first_claimer_should_update_view(
    cursor, supabase_client: supabase.Client
):
    # 0. Tom signs in
    supabase_client.auth.sign_up(email="tom@gmail.com", password="password")
    user = supabase_client.auth.sign_in(email="tom@gmail.com", password="password")

    # 1. Tom claims EPCI "Haut - Bugey Agglomération"
    response = await supabase_rpc_as_user(
        supabase_client,
        user,
        func_name="claim_epci",
        params={"siren": bugey_epci_siren},
    )
    assert bool(response.content)

    # 2. Tom also claims EPCI "CA du Bassin de Bourg-en-Bresse"
    response = await supabase_rpc_as_user(
        supabase_client,
        user,
        func_name="claim_epci",
        params={"siren": beb_epci_siren},
    )
    assert bool(response.content)

    # 3. View should return the two EPCIs (ordered by name)
    query = supabase_client.from_("client_owned_epci").select("*")
    query = supabase_query_as_user(supabase_client, user, query)
    response = query.execute()
    client_owned_epci = response["data"]
    assert client_owned_epci == [
        {
            "siren": beb_epci_siren,
            "role_name": "agent",
            "nom": beb_epci_nom,
        },
        {
            "siren": bugey_epci_siren,
            "role_name": "agent",
            "nom": bugey_epci_nom,
        },
    ]


@pytest.mark.asyncio
async def test_claim_epci_nok_for_second_claimer(supabase_client):
    # Tom signs in and claims EPCI Bugey
    supabase_client.auth.sign_up(email="tom@gmail.com", password="password")
    response = await supabase_client.postgrest.rpc(
        "claim_epci", {"siren": beb_epci_siren}
    )
    assert response == {"claim_epci": True}

    # Then, erik claims this same EPCI
    supabase_client.auth.sign_up(email="erik@gmail.com", password="password")
    response = await supabase_client.postgrest.rpc(
        "claim_epci", {"siren": beb_epci_siren}
    )
    assert response == {"claim_epci": False}
