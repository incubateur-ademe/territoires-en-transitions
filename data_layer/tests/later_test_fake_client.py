"""
Test what a client would do.
The client talks to the database using the supabase sdk only.
"""

from generated_models.store_action_statut import StoreActionStatut


def test_epcis_list_should_contain_the_default_epci(app_client):
    epcis = app_client.list_epci()
    assert len(epcis) == 1
    assert epcis[0].nom == "Yolo dodo"


def test_saving_a_statut_should_be_ok(app_client):
    statut = StoreActionStatut(
        epci_id=1,
        modified_by="2f74a871-b601-4d0e-930d-8b5460ae0270",
        referentiel="eci",
        action_id="1.1.1.2",
        avancement="fait",
        concerne=True,
    )
    result = app_client.save_statut(statut)
    assert result["status_code"] == 201


def test_saving_a_statut_with_a_bad_epci_id_should_fail(app_client):
    statut = StoreActionStatut(
        epci_id=99,
        modified_by="2f74a871-b601-4d0e-930d-8b5460ae0270",
        referentiel="eci",
        action_id="1.1.1.1",
        avancement="fait",
        concerne=True,
    )
    result = app_client.save_statut(statut)
    assert result["status_code"] == 409


def test_saving_a_statut_with_a_bad_user_id_should_fail(app_client):
    statut = StoreActionStatut(
        epci_id=1,
        modified_by="9999a871-b601-4d0e-930d-8b5460ae0270",
        referentiel="eci",
        action_id="1.1.1.1",
        avancement="fait",
        concerne=True,
    )
    result = app_client.save_statut(statut)
    assert result["status_code"] == 409
