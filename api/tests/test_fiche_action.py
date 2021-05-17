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
path = "/v1/fiche_action"

fiche_action = {
    "avancement": "pas_faite",
    "budget": "1234",
    "commentaire": "",
    "custom_id": "a.b.b",
    "date_debut": "2021-04-04",
    "date_fin": "",
    "description": "yolo",
    "epci_id": "test",
    "porteur": "",
    "referentiel_action_ids": ["citergie/1.1.1"],
    "referentiel_indicateur_ids": ["1a"],
    "titre": "hello",
    "uid": "59fcc45b-ff19-4723-9c18-9a972f4440f3"
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
    post_path = f"{path}/{fiche_action['epci_id']}"
    list_path = f"{path}/{fiche_action['epci_id']}/all"
    item_path = f"{path}/{fiche_action['epci_id']}/{fiche_action['uid']}"

    response = client.post(post_path, json=fiche_action)
    assert response.status_code == 200
    assert response.json()['uid'] == fiche_action['uid']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == fiche_action['uid']

    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['uid'] == fiche_action['uid']

    response = client.delete(item_path)
    assert response.status_code == 200

    response = client.get(item_path)
    assert response.status_code == 404

    response = client.delete(item_path)
    assert response.status_code == 404
