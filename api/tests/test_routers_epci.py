# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from tortoise.contrib.test import finalizer, initializer

from api.app import app
from api.config.database import DB_MODELS
from tests.auth_utils import add_ecriture_droit, auth_headers

client = TestClient(app)
path = "/v2/epci"

epci = {
    "uid": "red-kingdom",
    "insee": "",
    "siren": "",
    "nom": "Red Kingdom"
}

post_path = f"{path}"
list_path = f"{path}/all"
item_path = f"{path}/{epci['uid']}"


@pytest.fixture(scope="module")
def client() -> Generator:
    initializer(DB_MODELS)
    with TestClient(app) as c:
        yield c
    finalizer()


@pytest.fixture(scope="module")
def event_loop(client: TestClient) -> Generator:
    yield client.task.get_loop()


def test_add(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # POST /v2/action_status/epci_id
    response = client.post(post_path, json=epci, headers=auth_headers())
    assert response.status_code == 200
    assert response.json()['uid'] == epci['uid']

    # GET /v2/action_status/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == epci['uid']

    # GET /v2/action_status/epci_id/uid
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['uid'] == epci['uid']


def test_update(client: TestClient):
    add_ecriture_droit(client, epci_id=epci['uid'])

    new_data = {
        "nom": "Blue Kingdom",
    }

    updated_epci = {
        **epci, **new_data
    }

    response = client.post(post_path, headers=auth_headers(), json=updated_epci)

    assert response.status_code == 200
    assert response.json()['uid'] == epci['uid']
    assert response.json()['nom'] == new_data['nom']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == epci['uid']
    assert response.json()[0]['nom'] == new_data['nom']
