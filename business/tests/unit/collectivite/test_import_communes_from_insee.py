from business.collectivite.domain.commune import Commune
from business.collectivite.domain.collectivite_repo import (
    InMemoryCollectiviteRepository,
)
from business.collectivite.domain.import_insee_communes_to_collectivite_repo import (
    import_insee_communes_to_collectivite_repo,
)


def test_import_communes_from_insee_2021():
    collectivite_repo = InMemoryCollectiviteRepository()
    import_insee_communes_to_collectivite_repo(collectivite_repo)
    assert len(collectivite_repo.communes) == 3809
    assert collectivite_repo.communes[0] == Commune(
        nom="Ambérieu-en-Bugey", code="01004"
    )
