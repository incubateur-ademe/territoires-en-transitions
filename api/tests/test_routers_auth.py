# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio

import pytest
from fastapi.testclient import TestClient

from api.config.configuration import AUTH_DISABLED_DUMMY_USER
from tests.auth_utils import auth_headers

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


def test_identity(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    assert AUTH_DISABLED_DUMMY_USER

    # POST /v2/auth/identity
    response = client.get(identity_path, headers=auth_headers())
    assert response.status_code == 200
    assert response.json()["ademe_user_id"] == "dummy"
