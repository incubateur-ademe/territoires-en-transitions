# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio

from fastapi.testclient import TestClient

from tests.utils.auth import add_ecriture_droit, auth_headers

path = "/v2/indicateur_referentiel_commentaire"

indicateur_referentiel_commentaire = {
    "epci_id": "test",
    "indicateur_id": "12",
    "value": "It's no use going back to yesterday, because I was a different person then.",
}

post_path = f"{path}/{indicateur_referentiel_commentaire['epci_id']}"
list_path = f"{path}/{indicateur_referentiel_commentaire['epci_id']}/all"
item_path = f"{path}/{indicateur_referentiel_commentaire['epci_id']}/{indicateur_referentiel_commentaire['indicateur_id']}"


def test_droits(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    # 401
    # POST /v2/indicateur_referentiel_commentaire/epci_id
    response = client.post(
        post_path,
        headers=auth_headers(),
        json=indicateur_referentiel_commentaire,
    )
    assert response.status_code == 401


def test_crud_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    add_ecriture_droit(client, epci_id=indicateur_referentiel_commentaire["epci_id"])

    # POST /v2/indicateur_referentiel_commentaire/epci_id
    response = client.post(
        post_path, json=indicateur_referentiel_commentaire, headers=auth_headers()
    )
    assert response.status_code == 200
    assert (
        response.json()["indicateur_id"]
        == indicateur_referentiel_commentaire["indicateur_id"]
    )

    # GET /v2/indicateur_referentiel_commentaire/epci_id/all
    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert (
        response.json()[0]["indicateur_id"]
        == indicateur_referentiel_commentaire["indicateur_id"]
    )

    # GET /v2/indicateur_referentiel_commentaire/epci_id/indicateur_id
    response = client.get(item_path)
    assert response.status_code == 200
    assert (
        response.json()["indicateur_id"]
        == indicateur_referentiel_commentaire["indicateur_id"]
    )


def test_update_indicateur_referentiel_commentaire(client: TestClient):
    new_data = {
        "value": "And what is the use of a book,' thought Alice, 'without pictures or conversation?",
    }

    existing_indicateur_referentiel_commentaire = {
        **indicateur_referentiel_commentaire,
        **new_data,
    }

    post_path = f"{path}/{existing_indicateur_referentiel_commentaire['epci_id']}"
    response = client.post(
        post_path,
        json=existing_indicateur_referentiel_commentaire,
        headers=auth_headers(),
    )

    assert response.status_code == 200
    assert (
        response.json()["indicateur_id"]
        == existing_indicateur_referentiel_commentaire["indicateur_id"]
    )
    assert (
        response.json()["value"] == existing_indicateur_referentiel_commentaire["value"]
    )

    response = client.get(list_path)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert (
        response.json()[0]["indicateur_id"]
        == existing_indicateur_referentiel_commentaire["indicateur_id"]
    )
    assert (
        response.json()[0]["value"]
        == existing_indicateur_referentiel_commentaire["value"]
    )


def test_create_mismatched_indicateur_referentiel_commentaire(client: TestClient):
    mismatched_data = {
        "epci_id": "mismatch-epci-id",
    }
    mismatched_indicateur_referentiel_commentaire = {
        **indicateur_referentiel_commentaire,
        **mismatched_data,
    }

    post_path = f"{path}/{indicateur_referentiel_commentaire['epci_id']}"
    response = client.post(
        post_path,
        json=mismatched_indicateur_referentiel_commentaire,
        headers=auth_headers(),
    )

    assert response.status_code == 400
