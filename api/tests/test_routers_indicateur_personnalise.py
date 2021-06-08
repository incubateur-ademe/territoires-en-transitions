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
path = "/v1/indicateur_personnalise"

indicateur_personnalise = {
    "epci_id": "test",
    "uid": "59fcc45b-ff19-4723-9c18-9a972f4440f3",
    "custom_id": "42b",
    "nom": "Teacup",
    "description": "We’re all mad here. I’m mad. You’re mad.",
    "unite": "spoon",
}

post_path = f"{path}/{indicateur_personnalise['epci_id']}"
list_path = f"{path}/{indicateur_personnalise['epci_id']}/all"
item_path = f"{path}/{indicateur_personnalise['epci_id']}/{indicateur_personnalise['uid']}"


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
    # POST /epci_id/v1/indicateur_personnalise
    response = client.post(post_path, json=indicateur_personnalise)
    assert response.status_code == 200
    assert response.json()['uid'] == indicateur_personnalise['uid']

    # GET /epci_id/v1/indicateur_personnalise/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == indicateur_personnalise['uid']

    # GET /epci_id/v1/indicateur_personnalise/uid
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['uid'] == indicateur_personnalise['uid']

    # DELETE /epci_id/v1/indicateur_personnalise/uid
    response = client.delete(item_path)
    assert response.status_code == 200

    # 404
    # GET /epci_id/v1/indicateur_personnalise/uid
    response = client.get(item_path)
    assert response.status_code == 404

    # DELETE /epci_id/v1/indicateur_personnalise/uid
    response = client.delete(item_path)
    assert response.status_code == 404


def test_update_indicateur_personnalise(client: TestClient):
    new_data = {
        "nom": "Cheshire Cat",
    }

    existing_indicateur_personnalise = {
        **indicateur_personnalise, **new_data
    }

    post_path = f"{path}/{existing_indicateur_personnalise['epci_id']}"
    response = client.post(post_path, json=existing_indicateur_personnalise)

    assert response.status_code == 200
    assert response.json()['uid'] == existing_indicateur_personnalise['uid']
    assert response.json()['nom'] == existing_indicateur_personnalise['nom']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == existing_indicateur_personnalise['uid']
    assert response.json()[0]['nom'] == existing_indicateur_personnalise['nom']


def test_create_mismatched_indicateur_personnalise(client: TestClient):
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_indicateur_personnalise = {
        **indicateur_personnalise, **mismatched_data
    }

    post_path = f"{path}/{indicateur_personnalise['epci_id']}"
    response = client.post(post_path, json=mismatched_indicateur_personnalise)

    assert response.status_code == 400
