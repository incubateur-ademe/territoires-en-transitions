# mypy: no-disallow-untyped-decorators
# pylint: disable=E0611,E0401
from api.models.tortoise.any_indicateur_values import IndicateurPersonnaliseResultat

from fastapi.testclient import TestClient
from requests import Response

from tests.utils.auth import add_ecriture_droit, auth_headers

path = "/v2/indicateur_personnalise_resultat"

epci_id = "test"

indicateur_X_2019 = {
    "epci_id": epci_id,
    "indicateur_id": "X",
    "year": 2019,
    "value": 5000.3,
}

indicateur_X_2020 = {
    "epci_id": epci_id,
    "indicateur_id": "X",
    "year": 2020,
    "value": 3000.3,
}

indicateur_Z_2020 = {
    "epci_id": epci_id,
    "indicateur_id": "Z",
    "year": 2020,
    "value": 3000.3,
}

post_path = f"{path}/{epci_id}"
# get_item_path = f"{path}/{epci_id}/{indicateur_id}/{indicateur_year}"


def test_droits(client: TestClient):
    # 401
    # POST /v2/indicateur_personnalise_value/epci_id
    response = client.post(
        post_path,
        # headers=auth_headers(),
        json=indicateur_X_2019,
    )
    assert response.status_code == 401


# ------ utils -----------
def is_subset_of(d1: dict, d2: dict):
    return d1.items() <= d2.items()


def post_with_droits(
    client: TestClient,
    epci_id: str,
    post_json: dict,
    post_path: str,
) -> Response:
    add_ecriture_droit(client, epci_id=epci_id)
    return client.post(post_path, json=post_json, headers=auth_headers())


def get_from_client_with_success(client: TestClient, get_path: str):
    response = client.get(get_path)
    assert response.status_code == 200
    return response.json()


def assert_lists_equal(l1: list, l2: list):
    for item in l1:
        assert item in l2


# ------------------------


async def prepare_retrieving_tests(client: TestClient):
    # TODO : FLUSH DB BEFORE
    # await IndicateurPersonnaliseResultat.filter({}).delete()
    post_with_droits(client, epci_id, post_json=indicateur_X_2019, post_path=post_path)
    post_with_droits(client, epci_id, post_json=indicateur_X_2020, post_path=post_path)
    post_with_droits(client, epci_id, post_json=indicateur_Z_2020, post_path=post_path)


def test_can_publish(client: TestClient):
    response = post_with_droits(
        client, epci_id, post_json=indicateur_X_2019, post_path=post_path
    )
    assert response.status_code == 200
    assert is_subset_of(indicateur_X_2019, response.json())


def test_can_retrieve_by_given_id_and_year(client: TestClient):
    prepare_retrieving_tests(client)
    response = get_from_client_with_success(client, f"{path}/{epci_id}/X/2019")
    assert response == indicateur_X_2019


def test_can_retrieve_all(client: TestClient):
    prepare_retrieving_tests(client)

    response = get_from_client_with_success(client, f"{path}/{epci_id}/all")
    assert len(response) == 3
    assert_lists_equal(
        response, [indicateur_Z_2020, indicateur_X_2019, indicateur_X_2020]
    )


def test_can_retrieve_by_id_yearly(client: TestClient):
    prepare_retrieving_tests(client)
    response = get_from_client_with_success(client, f"{path}/{epci_id}/X")
    assert len(response) == 2
    assert_lists_equal(response, [indicateur_X_2019, indicateur_X_2020])


def test_update_value(client: TestClient):
    old_value = {
        "epci_id": epci_id,
        "indicateur_id": "Z",
        "year": 2020,
        "value": 3000.3,
    }

    new_value = {
        "epci_id": epci_id,
        "indicateur_id": "Z",
        "year": 2020,
        "value": 100.8,
    }
    post_with_droits(client, epci_id, old_value, post_path)
    post_with_droits(client, epci_id, new_value, post_path)

    # TODO : get from DB instead of using the API again
    # latest = await IndicateurPersonnaliseResultat.filter(
    #     epci_id=epci_id, indicateur_id="Z", year=2020, latest=True
    # )
    latest = get_from_client_with_success(client, f"{path}/{epci_id}/Z/2020")
    assert latest == new_value


def test_create_post_with_mismatched_epci_id(client: TestClient):
    epci_id_in_path = "epci_1"
    epci_id_in_body = "epci_2"

    json_with_mismatch_epci_id = {
        "epci_id": epci_id_in_body,
        "indicateur_id": "X",
        "year": 2020,
        "value": 3000.3,
    }

    response = post_with_droits(
        client,
        epci_id="test",
        post_json=json_with_mismatch_epci_id,
        post_path=f"{path}/{epci_id_in_path}",
    )

    assert response.status_code == 400
