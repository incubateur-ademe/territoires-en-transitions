import abc
from typing import List, Optional

from business.collectivite.domain.epci import Epci
from business.collectivite.domain.commune import Commune


class AbstractCollectiviteRepository(abc.ABC):
    @abc.abstractmethod
    def add_epcis(self, epcis: List[Epci]):
        raise NotImplementedError

    @abc.abstractmethod
    def add_communes(self, communes: List[Commune]):
        raise NotImplementedError


class InMemoryCollectiviteRepository(AbstractCollectiviteRepository):
    def __init__(
        self,
        epcis: Optional[List[Epci]] = None,
        communes: Optional[List[Commune]] = None,
    ) -> None:
        self.epcis = epcis or []
        self.communes = communes or []

    def add_epcis(self, epcis: List[Epci]):
        self.epcis += epcis

    def add_communes(self, communes: List[Commune]):
        self.communes += communes
