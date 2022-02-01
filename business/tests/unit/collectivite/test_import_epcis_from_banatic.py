from business.collectivite.domain.epci import Epci
from business.collectivite.domain.collectivite_repo import (
    InMemoryCollectiviteRepository,
)
from business.collectivite.domain.import_banatic_xlsx_to_collectivite_repo import (
    import_banatic_xlsx_to_collectivite_repo,
)


def test_import_epci_from_banatic_2021():
    collectivite_repo = InMemoryCollectiviteRepository()
    import_banatic_xlsx_to_collectivite_repo(collectivite_repo)
    assert len(collectivite_repo.epcis) == 1628
    assert collectivite_repo.epcis[0] == Epci(
        nom="Haut - Bugey Agglomération", siren="200042935", nature="CA"
    )
