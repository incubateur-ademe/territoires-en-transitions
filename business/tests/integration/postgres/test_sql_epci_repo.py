from pathlib import Path

from tests.utils.postgres_fixtures import *
from business.epci.adaters.sql_epci_repo import SqlEpciRepository
from business.epci.domain.epci import Epci
from tests.utils.files import remove_file, mkdir


def test_can_add_epcis(postgres_connection):

    sql_path = Path("./tests/data/tmp/epcis.sql")
    mkdir(sql_path.parent)
    remove_file(sql_path)

    repo = SqlEpciRepository(sql_path)

    epci1 = Epci("Pénélopie sur l'apostrophe", "000000000", "CC")
    epci2 = Epci("Florianus - Raphaëlle", "111111111", "CC")

    repo.add_epcis([epci1, epci2])

    with open(sql_path) as file:
        file_content = file.read()
    assert (
        file_content
        == "insert into epci(nom, siren, nature) values ('Pénélopie sur l''apostrophe', '000000000', 'CC');\n"
        "insert into epci(nom, siren, nature) values ('Florianus - Raphaëlle', '111111111', 'CC');\n"
    )

    # check that sql can be executed and epci can be added
    test_cursor = postgres_connection.cursor(row_factory=dict_row)
    test_cursor.execute(file_content)
    test_cursor.execute(
        "select nom, siren, nature from epci where siren in ('000000000', '111111111');"
    )
    inserted_epcis = test_cursor.fetchall()
    assert len(inserted_epcis) == 2
    assert inserted_epcis == [
        {"nom": "Pénélopie sur l'apostrophe", "siren": "000000000", "nature": "CC"},
        {"nom": "Florianus - Raphaëlle", "siren": "111111111", "nature": "CC"},
    ]
