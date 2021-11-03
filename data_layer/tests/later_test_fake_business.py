"""
Test what the business layer would do.
The business talks to the database the data_layer only.
"""
from generated_models.store_action_statut import StoreActionStatut


def test_saving_statut_from_client_should_trigger_callback_in_business(
    app_client, business
):
    statut = StoreActionStatut(
        epci_id=1,
        modified_by="2f74a871-b601-4d0e-930d-8b5460ae0270",
        referentiel="eci",
        action_id="1.1.1.2",
        avancement="fait",
        concerne=True,
    )

    socket = business.listen_business_action_statut_update()
    socket.listen()
