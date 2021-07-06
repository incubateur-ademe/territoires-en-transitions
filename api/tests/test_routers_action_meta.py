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
path = "/v2/action_meta"

meta = {
    "action_id": "1.1.1.1",
    "epci_id": "test",
    "meta": {
        "commentaire": "omg",
        "autre": ""
    }
}

post_path = f"{path}/{meta['epci_id']}"
list_path = f"{path}/{meta['epci_id']}/all"
item_path = f"{path}/{meta['epci_id']}/{meta['action_id']}"


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
    # POST /v2/action_meta/epci_id
    response = client.post(
        post_path,
        headers=auth_headers(),
        json=meta,
    )
    assert response.status_code == 401


def test_crud_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    add_ecriture_droit(client, epci_id=meta['epci_id'])

    # POST /v2/action_meta/epci_id
    response = client.post(post_path, json=meta, headers=auth_headers())
    assert response.status_code == 200
    assert response.json()['action_id'] == meta['action_id']

    # GET /v2/action_meta/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['action_id'] == meta['action_id']

    # GET /v2/action_meta/epci_id/action_id
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['action_id'] == meta['action_id']


def test_update_meta(client: TestClient):
    add_ecriture_droit(client, epci_id=meta['epci_id'])

    new_data = {
        "meta": {
            "commentaire": "hello"
        },
    }

    new_meta = {
        **meta, **new_data
    }

    post_path = f"{path}/{new_meta['epci_id']}"
    response = client.post(post_path, headers=auth_headers(), json=new_meta)

    assert response.status_code == 200
    assert response.json()['action_id'] == meta['action_id']
    assert response.json()['meta'] == new_meta['meta']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['action_id'] == meta['action_id']
    assert response.json()[0]['meta'] == new_meta['meta']


def test_create_mismatched_meta(client: TestClient):
    add_ecriture_droit(client, epci_id=meta['epci_id'])
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_meta = {
        **meta, **mismatched_data
    }

    post_path = f"{path}/{meta['epci_id']}"
    response = client.post(post_path, headers=auth_headers(), json=mismatched_meta)

    assert response.status_code == 400
