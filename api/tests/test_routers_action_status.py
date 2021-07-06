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
path = "/v2/action_status"

status = {
    "action_id": "1.1.1.1",
    "epci_id": "test",
    "avancement": "faite"
}

post_path = f"{path}/{status['epci_id']}"
list_path = f"{path}/{status['epci_id']}/all"
item_path = f"{path}/{status['epci_id']}/{status['action_id']}"


@pytest.fixture(scope="module")
def client() -> Generator:
    initializer(DB_MODELS)
    with TestClient(app) as c:
        yield c
    finalizer()


@pytest.fixture(scope="module")
def event_loop(client: TestClient) -> Generator:
    yield client.task.get_loop()


def test_droits(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # 401
    # POST /v2/action_status/epci_id
    response = client.post(
        post_path,
        headers=auth_headers(),
        json=status,
    )
    assert response.status_code == 401


def test_crud_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    add_ecriture_droit(client, epci_id=status['epci_id'])

    # POST /v2/action_status/epci_id
    response = client.post(post_path, json=status, headers=auth_headers())
    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']

    # GET /v2/action_status/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['action_id'] == status['action_id']

    # GET /v2/action_status/epci_id/action_id
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']


def test_update_status(client: TestClient):
    add_ecriture_droit(client, epci_id=status['epci_id'])

    new_data = {
        "avancement": "programmee",
    }

    new_status = {
        **status, **new_data
    }

    post_path = f"{path}/{new_status['epci_id']}"
    response = client.post(post_path, headers=auth_headers(), json=new_status)

    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']
    assert response.json()['avancement'] == new_status['avancement']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['action_id'] == status['action_id']
    assert response.json()[0]['avancement'] == new_status['avancement']


def test_create_mismatched_status(client: TestClient):
    add_ecriture_droit(client, epci_id=status['epci_id'])
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_status = {
        **status, **mismatched_data
    }

    post_path = f"{path}/{status['epci_id']}"
    response = client.post(post_path, headers=auth_headers(), json=mismatched_status
                           )

    assert response.status_code == 400
