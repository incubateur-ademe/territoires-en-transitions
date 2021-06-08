# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from tortoise.contrib.test import finalizer, initializer

from api.app import app
from api.config.database import DB_MODELS

client = TestClient(app)
path = "/v1/action_status"

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


def test_crud_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # POST /v1/action_status/epci_id
    response = client.post(post_path, json=status)
    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']

    # GET /v1/action_status/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['action_id'] == status['action_id']

    # GET /v1/action_status/epci_id/action_id
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']

    # DELETE /v1/action_status/epci_id/action_id
    response = client.delete(item_path)
    assert response.status_code == 200

    # 404
    # GET /v1/action_status/epci_id/action_id
    response = client.get(item_path)
    assert response.status_code == 404

    # DELETE /v1/action_status/epci_id/action_id
    response = client.delete(item_path)
    assert response.status_code == 404


def test_update_status(client: TestClient):
    new_data = {
        "avancement": "programmee",
    }

    existing_status = {
        **status, **new_data
    }

    post_path = f"{path}/{existing_status['epci_id']}"
    response = client.post(post_path, json=existing_status)

    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']
    assert response.json()['avancement'] == existing_status['avancement']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['action_id'] == status['action_id']
    assert response.json()[0]['avancement'] == existing_status['avancement']


def test_create_mismatched_status(client: TestClient):
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_status = {
        **status, **mismatched_data
    }

    post_path = f"{path}/{status['epci_id']}"
    response = client.post(post_path, json=mismatched_status)

    assert response.status_code == 400
