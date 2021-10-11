# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio

import pytest
from fastapi.testclient import TestClient

from api.config.configuration import AUTH_DISABLED_DUMMY_USER
from api.utils.connection_api import DummyConnectionApi
from tests.utils.auth import auth_headers
from api.models.tortoise.utilisateur_connecte import UtilisateurConnecte
from api.routers.v2.auth import connection_api

path = "/v2/auth"

registration = {
    "email": "tweedledee@wood.com",
    "nom": "Tweedle",
    "prenom": "Dee",
    "vie_privee": "ditto",
}

register_path = f"{path}/register"
identity_path = f"{path}/identity"


@pytest.mark.skip(
    reason="no way of currently testing this without being connected to the VPN"
)
def test_register(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # POST /v2/auth/register
    response = client.post(register_path, json=registration)
    assert response.status_code == 200


def test_identity_infos_is_saved(
    client: TestClient, event_loop: asyncio.AbstractEventLoop
):
    assert AUTH_DISABLED_DUMMY_USER

    # Fred connects
    connection_api.set_user_name(nom="Fred")  # type: ignore
    response = client.get(identity_path, headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["ademe_user_id"] == "dummy"

    query = event_loop.run_until_complete(
        UtilisateurConnecte.filter(
            ademe_user_id="dummy",
        )
    )
    assert query[0].nom == "Fred"

    # Fred connects with new name Frederic
    connection_api.set_user_name(nom="Frederic")  # type: ignore
    response = client.get(identity_path, headers=auth_headers())
    query = event_loop.run_until_complete(
        UtilisateurConnecte.filter(
            ademe_user_id="dummy",
        )
    )
    assert query[0].nom == "Frederic"
