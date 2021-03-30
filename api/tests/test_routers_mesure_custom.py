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
path = "/v1/mesure_custom"

mesure_custom = {
    "uid": "4a1bc73d-aa72-4d28-8424-889643fa29c2",
    "epci_id": "test",
    "climat_pratic_thematic_id": "strategie",
    "name": "faire des trucs"
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
    post_path = f"{path}/{mesure_custom['epci_id']}"
    list_path = f"{path}/{mesure_custom['epci_id']}/all"
    item_path = f"{path}/{mesure_custom['epci_id']}/{mesure_custom['uid']}"

    response = client.post(post_path, json=mesure_custom)
    assert response.status_code == 200
    assert response.json()['uid'] == mesure_custom['uid']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == mesure_custom['uid']

    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['uid'] == mesure_custom['uid']

    response = client.delete(item_path)
    assert response.status_code == 200

    response = client.get(item_path)
    assert response.status_code == 404

    response = client.delete(item_path)
    assert response.status_code == 404
