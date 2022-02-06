from pathlib import Path

from business.collectivite.adapters.sql_collectivite_repo import (
    SqlCollectiviteRepository,
)
from business.collectivite.domain.epci import Epci
from tests.utils.files import remove_file, mkdir


def test_can_add_epcis():

    sql_epci_path = Path("./tests/data/tmp/epcis.sql")
    mkdir(sql_epci_path.parent)
    remove_file(sql_epci_path)

    repo = SqlCollectiviteRepository(sql_epci_path, Path())

    epci1 = Epci("Pénélopie sur l'apostrophe", "000000000", "CC")
    epci2 = Epci("Florianus - Raphaëlle", "111111111", "CC")

    repo.add_epcis([epci1, epci2])

    with open(sql_epci_path) as file:
        file_content = file.read()
    assert (
        file_content
        == "insert into epci(nom, siren, nature) values ('Pénélopie sur l''apostrophe', '000000000', 'CC');\n"
        "insert into epci(nom, siren, nature) values ('Florianus - Raphaëlle', '111111111', 'CC');\n"
    )
