from business.epci.domain.epci import Epci
from business.epci.domain.epci_repo import InMemoryEpciRepository
from business.epci.domain.import_banatic_xlsx_to_epci_repo import (
    import_banatic_xlsx_to_epci_repo,
)


def test_import_epci_from_banatic_2021():
    epci_repo = InMemoryEpciRepository()
    import_banatic_xlsx_to_epci_repo(epci_repo)
    assert len(epci_repo.epcis) == 1628
    assert epci_repo.epcis[0] == Epci(
        nom="Haut - Bugey Agglomération", siren="200042935", nature="CA"
    )
