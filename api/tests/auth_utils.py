from requests import Response
from starlette.testclient import TestClient

path = "/v2/utilisateur_droits"


def add_ecriture_droit(client: TestClient, ademe_user_id="dummy", epci_id="test", ecriture=True) -> Response:
    droits = {
        "ademe_user_id": ademe_user_id,
        "epci_id": epci_id,
        "ecriture": ecriture
    }

    response = client.post(
        path,
        headers=auth_headers(),
        json=droits,
    )
    assert response.status_code == 200
    return response


def auth_headers(access_token='xx') -> dict:
    return {'Authorization': f'Bearer {access_token}'}
