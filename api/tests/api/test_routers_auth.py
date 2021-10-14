# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio

import pytest
from fastapi.testclient import TestClient

from api.config.configuration import AUTH_DISABLED_DUMMY_USER
from tests.utils.auth import auth_headers
from api.models.tortoise.ademe_utilisateur import AdemeUtilisateur
from api.routers.v2.auth import connection_api

path = "/v2/auth"

registration = {
    "email": "tweedledee@wood.com",
    "nom": "Tweedle",
    "prenom": "Dee",
    "vie_privee": "ditto",
}

register_path = f"{path}/register"
token_path = f"{path}/token"


@pytest.mark.skip(
    reason="no way of currently testing this without being connected to the VPN"
)
def test_register(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # POST /v2/auth/register
    response = client.post(register_path, json=registration)
    assert response.status_code == 200


def test_user_infos_is_saved_on_token_call(
    client: TestClient, event_loop: asyncio.AbstractEventLoop
):
    assert AUTH_DISABLED_DUMMY_USER

    token_route_dummy_params = dict(code="some_code", redirect_uri="redirect_uri")

    # Fred connects
    dummy_ademe_user_id = connection_api.user.ademe_user_id
    connection_api.set_user_name(prenom="Fred")  # type: ignore
    response = client.get(
        token_path,
        params=token_route_dummy_params,
        headers=auth_headers(),
    )

    assert response.status_code == 200

    query = event_loop.run_until_complete(
        AdemeUtilisateur.filter(
            ademe_user_id=dummy_ademe_user_id,
        )
    )
    assert query[0].prenom == "Fred"

    # Fred connects with new name Frederic
    connection_api.set_user_name(prenom="Frederic")  # type: ignore
    response = client.get(
        token_path, params=token_route_dummy_params, headers=auth_headers()
    )
    query = event_loop.run_until_complete(
        AdemeUtilisateur.filter(
            ademe_user_id=dummy_ademe_user_id,
        )
    )
    assert query[0].prenom == "Frederic"
