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
path = "/v1/action_custom"

action = {
    "uid": "b836d2b4-49c3-4c07-ae5c-5374fae78exx",
    "epci_id": "test_epci",
    "mesure_id": "5d4e1246-47ff-410a-9b5b-baa65d2822e9",
    "name": "Alice",
    "description": "A girl in wonderland"
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
    post_path = f"{path}/{action['epci_id']}"
    list_path = f"{path}/{action['epci_id']}/all"
    item_path = f"{path}/{action['epci_id']}/{action['mesure_id']}/{action['uid']}"

    response = client.post(post_path, json=action)
    assert response.status_code == 200
    assert response.json()['uid'] == action['uid']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == action['uid']

    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['uid'] == action['uid']

    response = client.delete(item_path)
    assert response.status_code == 200

    response = client.get(item_path)
    assert response.status_code == 404

    response = client.delete(item_path)
    assert response.status_code == 404
