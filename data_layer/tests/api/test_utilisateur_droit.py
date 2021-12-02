import pytest
import supabase

from tests.utils.supabase import supabase_rpc_as_user, supabase_query_as_user

fake_user_id = "17440546-f389-4d4f-bfdb-b0c94a1bd0f9"
bugey_epci_siren = "200042935"
bugey_epci_nom = "Haut - Bugey Agglomération"
beb_epci_siren = "200071751"
beb_epci_nom = "CA du Bassin de Bourg-en-Bresse"


@pytest.mark.asyncio
async def test_user_claims_and_unclaims_epci_ok_for_first_claimer_should_become_referent_and_update_view(
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
    assert response == {"success": True}

    # 2. Tom also claims EPCI "CA du Bassin de Bourg-en-Bresse"
    response = await supabase_rpc_as_user(
        supabase_client,
        user,
        func_name="claim_epci",
        params={"siren": beb_epci_siren},
    )
    assert bool(response.content)
    assert response == {"success": True}

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

    # 4. Tom unclaims EPCI Bugey
    response = await supabase_rpc_as_user(
        supabase_client,
        user,
        func_name="unclaim_epci",
        params={"siren": bugey_epci_siren},
    )
    assert response == {"success": True}

    # 5.  View should now return the only EPCI
    query = supabase_client.from_("client_owned_epci").select("*")
    query = supabase_query_as_user(supabase_client, user, query)
    response = query.execute()
    client_owned_epci = response["data"]
    assert client_owned_epci == [
        {
            "siren": beb_epci_siren,
            "role_name": "agent",
            "nom": beb_epci_nom,
        }
    ]


@pytest.mark.asyncio
async def test_user_cannot_quit_epci_if_not_his(
    cursor, supabase_client: supabase.Client
):
    tom_user = await tom_signs_in_and_claim_bugey(supabase_client)

    # Tom quits EPCI Bugey
    response = await supabase_rpc_as_user(
        supabase_client,
        tom_user,
        func_name="quit_epci",
        params={"siren": beb_epci_siren},
    )
    assert response.status_code == 409
    assert (
        decode_response_message(response)
        == "Vous n'avez pas pu quitter la collectivité."
    )


@pytest.mark.asyncio
async def test_user_claims_epci_for_second_claimer_receives_referent_contact_informations(
    supabase_client,
):
    # Tom signs in and claims EPCI Bugey
    supabase_client.auth.sign_up(email="tom@gmail.com", password="password")
    response = await supabase_client.postgrest.rpc(
        "claim_epci", {"siren": beb_epci_siren}
    )
    assert response == {"success": True}

    # Then, erik claims this same EPCI
    supabase_client.auth.sign_up(email="erik@gmail.com", password="password")
    response = await supabase_client.postgrest.rpc(
        "claim_epci", {"siren": beb_epci_siren}
    )
    assert response == {"success": False, "reason": "already_claimed"}
