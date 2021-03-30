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
    post_path = f"{path}/{status['epci_id']}"
    list_path = f"{path}/{status['epci_id']}/all"
    item_path = f"{path}/{status['epci_id']}/{status['action_id']}"

    response = client.post(post_path, json=status)
    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['action_id'] == status['action_id']

    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['action_id'] == status['action_id']

    response = client.delete(item_path)
    assert response.status_code == 200

    response = client.get(item_path)
    assert response.status_code == 404

    response = client.delete(item_path)
    assert response.status_code == 404
