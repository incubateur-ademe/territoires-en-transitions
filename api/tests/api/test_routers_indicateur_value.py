# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio

from fastapi.testclient import TestClient

from tests.utils.auth import add_ecriture_droit, auth_headers
from tests.api.test_routers_action_status import status

path = "/v2/indicateur_value"

indicateur_value = {
    "epci_id": "test",
    "indicateur_id": "29",
    "year": 2016,
    "value": 1502.0,
}

post_path = f"{path}/{indicateur_value['epci_id']}"
list_path = f"{path}/{indicateur_value['epci_id']}/all"
yearly_list_path = (
    f"{path}/{indicateur_value['epci_id']}/{indicateur_value['indicateur_id']}"
)
item_path = f"{path}/{indicateur_value['epci_id']}/{indicateur_value['indicateur_id']}/{indicateur_value['year']}"


def test_droits(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # 401
    # POST /v2/indicateur_value/epci_id
    response = client.post(
        post_path,
        headers=auth_headers(),
        json=indicateur_value,
    )
    assert response.status_code == 401


def test_crud_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    add_ecriture_droit(client, epci_id=status["epci_id"])

    # POST /v2/indicateur_value/epci_id
    response = client.post(post_path, json=indicateur_value, headers=auth_headers())
    assert response.status_code == 200
    assert response.json()["indicateur_id"] == indicateur_value["indicateur_id"]

    # GET /v2/indicateur_value/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["indicateur_id"] == indicateur_value["indicateur_id"]

    # GET /v2/indicateur_value/epci_id/indicateur_id
    response = client.get(yearly_list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["indicateur_id"] == indicateur_value["indicateur_id"]

    # GET /v2/indicateur_value/epci_id/indicateur_id/year
    response = client.get(item_path)
    assert response.status_code == 200
    assert response.json()["indicateur_id"] == indicateur_value["indicateur_id"]


def test_update_indicateur_value(client: TestClient):
    new_data = {
        "value": 1234,
    }

    existing_indicateur_value = {**indicateur_value, **new_data}

    post_path = f"{path}/{existing_indicateur_value['epci_id']}"
    response = client.post(
        post_path, json=existing_indicateur_value, headers=auth_headers()
    )

    assert response.status_code == 200
    response_json = response.json()

    assert response_json["indicateur_id"] == existing_indicateur_value["indicateur_id"]
    assert response_json["value"] == existing_indicateur_value["value"]

    response = client.get(list_path)
    assert response.status_code == 200
    response_json = response.json()

    assert len(response_json) == 1

    assert (
        response_json[0]["indicateur_id"] == existing_indicateur_value["indicateur_id"]
    )
    assert response_json[0]["value"] == existing_indicateur_value["value"]


def test_create_mismatched_indicateur_value(client: TestClient):
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_indicateur_value = {**indicateur_value, **mismatched_data}

    post_path = f"{path}/{indicateur_value['epci_id']}"
    response = client.post(
        post_path, json=mismatched_indicateur_value, headers=auth_headers()
    )

    assert response.status_code == 400
