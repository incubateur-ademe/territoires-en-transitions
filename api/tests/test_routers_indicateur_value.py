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
path = "/v1/indicateur_value"

indicateur_value = {
    "epci_id": "test",
    "indicateur_id": "29",
    "year": 2016,
    "value": "1502"
}

post_path = f"{path}/{indicateur_value['epci_id']}"
list_path = f"{path}/{indicateur_value['epci_id']}/all"
yearly_list_path = f"{path}/{indicateur_value['epci_id']}/{indicateur_value['indicateur_id']}"
item_path = f"{path}/{indicateur_value['epci_id']}/{indicateur_value['indicateur_id']}/{indicateur_value['year']}"

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
    # POST /v1/indicateur_value/epci_id
    response = client.post(post_path, json=indicateur_value)
    assert response.status_code == 200
    assert response.json()['indicateur_id'] == indicateur_value['indicateur_id']

    # GET /v1/indicateur_value/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['indicateur_id'] == indicateur_value['indicateur_id']

    # GET /v1/indicateur_value/epci_id/indicateur_id
    response = client.get(yearly_list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['indicateur_id'] == indicateur_value['indicateur_id']

    # GET /v1/indicateur_value/epci_id/indicateur_id/year
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['indicateur_id'] == indicateur_value['indicateur_id']

    # DELETE /v1/indicateur_value/epci_id/indicateur_id/year
    response = client.delete(item_path)
    assert response.status_code == 200

    # 404
    # GET /v1/indicateur_value/epci_id/indicateur_id/year
    response = client.get(item_path)
    assert response.status_code == 404

    # DELETE /v1/indicateur_value/epci_id/indicateur_id/year
    response = client.delete(item_path)
    assert response.status_code == 404


def test_update_indicateur_value(client: TestClient):
    new_data = {
        "value": "1234",
    }

    existing_indicateur_value = {
        **indicateur_value, **new_data
    }

    post_path = f"{path}/{existing_indicateur_value['epci_id']}"
    response = client.post(post_path, json=existing_indicateur_value)

    assert response.status_code == 200
    assert response.json()['indicateur_id'] == existing_indicateur_value['indicateur_id']
    assert response.json()['value'] == existing_indicateur_value['value']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['indicateur_id'] == existing_indicateur_value['indicateur_id']
    assert response.json()[0]['value'] == existing_indicateur_value['value']


def test_create_mismatched_indicateur_value(client: TestClient):
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_indicateur_value = {
        **indicateur_value, **mismatched_data
    }

    post_path = f"{path}/{indicateur_value['epci_id']}"
    response = client.post(post_path, json=mismatched_indicateur_value)

    assert response.status_code == 400
