# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from tortoise.contrib.test import finalizer, initializer

from api.app import app
from api.config.database import DB_MODELS
from tests.auth_utils import auth_headers, add_ecriture_droit

client = TestClient(app)
path = "/v2/fiche_action_categorie"

categorie = {
    "epci_id": "test",
    "fiche_actions_uids": ["123abc", "456efg"],
    "nom": "Wonderland",
    "parent_uid": "",
    "uid": "59fcc45b-ff19-4723-9c18-9a972f4440f3",
}

list_path = f"{path}/{categorie['epci_id']}/all"
post_path = f"{path}/{categorie['epci_id']}"
item_path = f"{path}/{categorie['epci_id']}/{categorie['uid']}"


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
    # POST /v2/fiche_action_categorie/epci_id
    response = client.post(post_path, json=categorie, headers=auth_headers())
    assert response.status_code == 401


def test_crud_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    add_ecriture_droit(client, epci_id=categorie['epci_id'])

    # POST /v2/fiche_action_categorie/epci_id
    response = client.post(post_path, json=categorie, headers=auth_headers())
    assert response.status_code == 200
    assert response.json()['uid'] == categorie['uid']

    # GET /v2/fiche_action_categorie/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == categorie['uid']

    # GET /v2/fiche_action_categorie/epci_id/uid
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()['uid'] == categorie['uid']

    # DELETE /v2/fiche_action_categorie/epci_id/uid
    response = client.delete(item_path, headers=auth_headers())
    assert response.status_code == 200

    # 404
    # GET /v2/fiche_action_categorie/epci_id/uid
    response = client.get(item_path)
    assert response.status_code == 404

    # DELETE /v2/fiche_action_categorie/epci_id/uid
    response = client.delete(item_path, headers=auth_headers())
    assert response.status_code == 404


def test_update_fiche_action_categorie(client: TestClient):
    new_data = {
        "nom": "Alice",
    }

    existing_fiche_action_categorie = {
        **categorie, **new_data
    }

    post_path = f"{path}/{existing_fiche_action_categorie['epci_id']}"
    response = client.post(post_path, json=existing_fiche_action_categorie, headers=auth_headers())

    assert response.status_code == 200
    assert response.json()['uid'] == existing_fiche_action_categorie['uid']
    assert response.json()['nom'] == existing_fiche_action_categorie['nom']

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]['uid'] == existing_fiche_action_categorie['uid']
    assert response.json()[0]['nom'] == existing_fiche_action_categorie['nom']


def test_create_mismatched_fiche_action(client: TestClient):
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_fiche_action_categorie = {
        **categorie, **mismatched_data
    }

    post_path = f"{path}/{categorie['epci_id']}"
    response = client.post(post_path, json=mismatched_fiche_action_categorie, headers=auth_headers())

    assert response.status_code == 400
