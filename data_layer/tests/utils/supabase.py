from typing import Any, Dict

import supabase
from httpx import Response
from supabase.lib.query_builder import SupabaseQueryBuilder


async def supabase_rpc_as_user(
    supabase_client: supabase.Client,
    user: Dict[str, Any],
    func_name: str,
    params: Dict[str, Any],
) -> Response:
    """
    Returns the response of an rpc function executed as an user.

    :param supabase_client:
    :param user: the user from supabase auth
    :param func_name: rpc function name
    :param params: function named parameters
    :return:
    """
    path = f"/rpc/{func_name}"
    assert user.get("access_token"), "user must have an access token"
    headers: Dict[str, str] = {
        "apiKey": supabase_client.supabase_key,
        "Authorization": f"Bearer {user['access_token']}",
    }
    response = await supabase_client.postgrest.session.post(
        path, json=params, headers=headers
    )
    return response


def supabase_query_as_user(
    supabase_client: supabase.Client, user: Dict[str, Any], query: SupabaseQueryBuilder
):
    """
    Transform a query so it will be executable as an user.

    ex:
        q = supabase_client.from_("client_owned_epci").select("*")
        q = supabase_query_as_user(client, user, q)
        results = q.execute()

    :param supabase_client:
    :param user: the user from supabase auth
    :param query: the query to be executed as a user
    :return: the query ready to be executed as the user
    """
    headers = {
        "apiKey": supabase_client.supabase_key,
        "Authorization": f"Bearer {user['access_token']}",
        "Prefer": "return=representation",
        "Content-Type": "application/json",
    }
    query.session.headers = headers
    return query
