from business.epci.adaters.postgres_epci_repo import PostgresEpciRepository
from business.epci.domain.epci import Epci
from .fixtures import *


def test_can_add_epcis(postgres_connection):
    test_cursor = postgres_connection.cursor()

    repo = PostgresEpciRepository(postgres_connection)

    test_cursor.execute("select * from epci;")
    inserted_epcis = test_cursor.fetchall()

    epci1 = Epci("Pénélopie", "000000000", "CC")
    epci2 = Epci("Florianus", "111111111", "CC")

    repo.add_epcis([epci1, epci2])

    test_cursor.execute("select nom, siren, nature from epci;")
    inserted_epcis = test_cursor.fetchall()

    assert len(inserted_epcis) == 2
    assert inserted_epcis == [
        ("Pénélopie", "000000000", "CC"),
        ("Florianus", "111111111", "CC"),
    ]
