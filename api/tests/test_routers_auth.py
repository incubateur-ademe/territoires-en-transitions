# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from tortoise.contrib.test import finalizer, initializer

from api.app import app
from api.config.configuration import AUTH_DISABLED_DUMMY_USER
from api.config.database import DB_MODELS
from tests.auth_utils import auth_headers

client = TestClient(app)
path = "/v2/auth"

registration = {
    "email": "tweedledee@wood.com",
    "nom": "Tweedle",
    "prenom": "Dee",
    "vie_privee": "ditto"
}

register_path = f"{path}/register"
identity_path = f"{path}/identity"


@pytest.fixture(scope="module")
def client() -> Generator:
    initializer(DB_MODELS)
    with TestClient(app) as c:
        yield c
    finalizer()


@pytest.fixture(scope="module")
def event_loop(client: TestClient) -> Generator:
    yield client.task.get_loop()


@pytest.mark.skip(reason="no way of currently testing this without being connected to the VPN")
def test_register(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # POST /v2/auth/register
    response = client.post(register_path, json=registration)
    assert response.status_code == 200


def test_identity(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    assert AUTH_DISABLED_DUMMY_USER

    # POST /v2/auth/identity
    response = client.get(identity_path, headers=auth_headers())
    assert response.status_code == 200
    assert response.json()['ademe_user_id'] == 'dummy'
