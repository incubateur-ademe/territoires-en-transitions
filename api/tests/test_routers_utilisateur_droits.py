# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
import asyncio

from fastapi.testclient import TestClient

from api.config.configuration import AUTH_DISABLED_DUMMY_USER
from tests.auth_utils import add_ecriture_droit

path = "/v2/utilisateur_droits"

droits = {"ademe_user_id": "dummy", "epci_id": "test", "ecriture": True}

post_path = f"{path}"
list_path = f"{path}/{droits['ademe_user_id']}"


def test_add_item(client: TestClient, event_loop: asyncio.AbstractEventLoop):
    assert AUTH_DISABLED_DUMMY_USER

    # POST /v2/utilisateur_droits
    response = add_ecriture_droit(
        client, droits["ademe_user_id"], droits["epci_id"], droits["ecriture"]
    )
    assert response.status_code == 200
    assert response.json()["epci_id"] == droits["epci_id"]
