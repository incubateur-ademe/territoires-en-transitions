from typing import Dict, Any
import json

import pytest
import supabase
from httpx import Response

from tests.utils.supabase import supabase_rpc_as_user, supabase_query_as_user

tom_email = "tom@gmail.com"
tom_nom = "valley"
tom_prenom = "tom"
fake_user_id = "17440546-f389-4d4f-bfdb-b0c94a1bd0f9"
bugey_epci_siren = "200042935"
bugey_epci_nom = "Haut - Bugey Agglomération"
beb_epci_siren = "200071751"
beb_epci_nom = "CA du Bassin de Bourg-en-Bresse"

User = Dict[str, Any]


def decode_response_content(response: Response) -> str:
    return json.loads(response.content.decode())


def insert_dcp(supabase_client: supabase.Client, user: User, dcp: dict):
    query = supabase_client.table("dcp").insert(dcp)
    query = supabase_query_as_user(supabase_client, user, query)
    response = query.execute()
    assert response["status_code"] == 201


async def tom_signs_in_and_claim_bugey(supabase_client: supabase.Client) -> User:
    # 0. Tom signs in and inserts it DCP
    supabase_client.auth.sign_up(email=tom_email, password="password")
    user = supabase_client.auth.sign_in(email=tom_email, password="password")
    insert_dcp(
        supabase_client,
        user,
        {
            "nom": tom_nom,
            "prenom": tom_prenom,
            "email": tom_email,
            "user_id": user["user"]["id"],
        },
    )

    # 1. Tom claims EPCI "Haut - Bugey Agglomération"
    response = await supabase_rpc_as_user(
        supabase_client,
        user,
        func_name="claim_epci",
        params={"siren": bugey_epci_siren},
    )
    assert response.status_code == 200, "Tom could not sign in... "
    return user


@pytest.mark.asyncio
async def test_user_claims_epci_ok_for_first_claimer_should_become_referent_and_update_view(
    cursor, supabase_client: supabase.Client
):
    tom_user = await tom_signs_in_and_claim_bugey(supabase_client)

    # 2. Tom also claims EPCI "CA du Bassin de Bourg-en-Bresse"
    response = await supabase_rpc_as_user(
        supabase_client,
        tom_user,
        func_name="claim_epci",
        params={"siren": beb_epci_siren},
    )
    assert response.status_code == 200
    assert (
        decode_response_content(response)["message"]
        == "Vous êtes référent de la collectivité."
    )

    # 3. View client_owned_epci should return the two EPCIs with role referent (ordered by name)
    query = supabase_client.from_("owned_epci").select("*")
    query = supabase_query_as_user(supabase_client, tom_user, query)
    response = query.execute()
    owned_epci_data = response["data"]
    assert owned_epci_data == [
        {
            "siren": beb_epci_siren,
            "role_name": "referent",
            "nom": beb_epci_nom,
        },
        {
            "siren": bugey_epci_siren,
            "role_name": "referent",
            "nom": bugey_epci_nom,
        },
    ]

    # 3. View active_epci should return the two (now active) EPCIs (ordered by name)
    query = supabase_client.from_("active_epci").select("*")
    query = supabase_query_as_user(supabase_client, tom_user, query)
    response = query.execute()
    active_epci_data = response["data"]
    assert active_epci_data == [
        {
            "siren": beb_epci_siren,
            "nom": beb_epci_nom,
        },
        {
            "siren": bugey_epci_siren,
            "nom": bugey_epci_nom,
        },
    ]


@pytest.mark.asyncio
async def test_user_quits_his_epci_should_update_view(
    cursor, supabase_client: supabase.Client
):
    tom_user = await tom_signs_in_and_claim_bugey(supabase_client)

    # Tom quits EPCI Bugey
    response = await supabase_rpc_as_user(
        supabase_client,
        tom_user,
        func_name="quit_epci",
        params={"siren": bugey_epci_siren},
    )
    assert response.status_code == 200
    assert (
        decode_response_content(response)["message"]
        == "Vous avez quitté la collectivité."
    )


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
        decode_response_content(response)["message"]
        == "Vous n'avez pas pu quitter la collectivité."
    )


@pytest.mark.asyncio
async def test_user_claims_epci_for_second_claimer(supabase_client, cursor):
    # Tom signs in and claims EPCI Bugey
    await tom_signs_in_and_claim_bugey(supabase_client)

    # Then, erik claims this same EPCI
    erik_user = supabase_client.auth.sign_up(
        email="erik@gmail.com", password="password"
    )
    response = await supabase_rpc_as_user(
        supabase_client,
        erik_user,
        func_name="claim_epci",
        params={"siren": bugey_epci_siren},
    )

    assert response.status_code == 409
    assert (
        decode_response_content(response)["message"]
        == "La collectivité dispose déjà d'un référent."
    )


@pytest.mark.asyncio
async def test_user_requests_referent_contact_informations_for_epci_should_keep_trace(
    supabase_client, cursor
):
    await tom_signs_in_and_claim_bugey(supabase_client)

    # Then, erik signs in and requests referent contact for Bugey
    erik_user = supabase_client.auth.sign_up(
        email="erik@gmail.com", password="password"
    )
    response = await supabase_rpc_as_user(
        supabase_client,
        erik_user,
        func_name="referent_contact",
        params={"siren": bugey_epci_siren},
    )
    assert response.status_code == 200
    assert decode_response_content(response) == {
        "email": tom_email,
        "nom": tom_nom,
        "prenom": tom_prenom,
    }
