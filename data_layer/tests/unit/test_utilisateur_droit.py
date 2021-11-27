from tests.utils.sql_factories import make_sql_insert_user

fake_user_id = "17440546-f389-4d4f-bfdb-b0c94a1bd0f9"
bugey_epci_siren = "200042935"
bugey_epci_nom = "Haut - Bugey Agglomération"
beb_epci_siren = "200071751"
beb_epci_nom = "CA du Bassin de Bourg-en-Bresse"


def fake_authentication(cursor):
    # 1. fake authentification as fake_user_id
    cursor.execute(make_sql_insert_user(user_uid=fake_user_id))
    cursor.execute(
        f"""
    create or replace function auth.uid() returns uuid
    as 
    $$
    select '{fake_user_id}'::uuid;
    $$ language sql stable;
    """
    )


def test_claim_epci_ok_for_first_claimer_should_update_view(cursor):
    fake_authentication(cursor)

    # 1. User claims EPCI "Haut - Bugey Agglomération"
    cursor.execute(f"select claim_epci('{bugey_epci_siren}');")
    response = cursor.fetchone()
    assert response == {"claim_epci": True}

    # 2. User also claims EPCI "CA du Bassin de Bourg-en-Bresse"
    cursor.execute(f"select claim_epci('{beb_epci_siren}');")
    response = cursor.fetchone()
    assert response == {"claim_epci": True}

    # 3. View should return the two EPCIs (ordered by name)
    cursor.execute("select * from client_owned_epci")
    client_owned_epci = cursor.fetchall()
    assert client_owned_epci == [
        {
            "siren": beb_epci_siren,
            "role_name": "agent",
            "nom": beb_epci_nom,
        },
        {
            "siren": bugey_epci_siren,
            "role_name": "agent",
            "nom": bugey_epci_nom,
        },
    ]


def test_claim_epci_nok_for_second_claimer(cursor):
    fake_authentication(cursor)
    claimed_epci_siren = bugey_epci_siren
    cursor.execute(f"select claim_epci('{claimed_epci_siren}');")
    cursor.execute(f"select claim_epci('{claimed_epci_siren}');")
    response_second_claim = cursor.fetchone()
    assert response_second_claim == {"claim_epci": False}
