from requests import Response
from starlette.testclient import TestClient

from api.routers.v2.auth import connection_api

path = "/v2/utilisateur_droits"


def add_ecriture_droit(client: TestClient, epci_id: str, ecriture=True) -> Response:
    droits = {
        "ademe_user_id": connection_api.user.ademe_user_id,
        "epci_id": epci_id,
        "ecriture": ecriture,
    }

    response = client.post(
        path,
        headers=auth_headers(),
        json=droits,
    )
    assert response.status_code == 200
    return response


def auth_headers() -> dict:
    tokens = connection_api.get_tokens(code="", redirect_uri="")
    return {"Authorization": f"Bearer {tokens.access_token}"}
