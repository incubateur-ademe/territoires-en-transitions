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
from tests.auth_utils import add_ecriture_droit

client = TestClient(app)
path = "/v2/utilisateur_droits"

droits = {
    "ademe_user_id": "dummy",
    "epci_id": "test",
    "ecriture": True
}

post_path = f"{path}"
list_path = f"{path}/{droits['ademe_user_id']}"


@pytest.fixture(scope="module")
def client() -> Generator:
    initializer(DB_MODELS)
    with TestClient(app) as c:
        yield c
    finalizer()


@pytest.fixture(scope="module")
def event_loop(client: TestClient) -> Generator:
    yield client.task.get_loop()


def test_add_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    assert AUTH_DISABLED_DUMMY_USER

    # POST /v2/utilisateur_droits
    response = add_ecriture_droit(client, droits['ademe_user_id'], droits["epci_id"], droits["ecriture"])
    assert response.status_code == 200
    assert response.json()['epci_id'] == droits['epci_id']
