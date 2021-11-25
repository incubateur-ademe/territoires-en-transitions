import abc
from typing import List, Optional

from business.epci.domain.epci import Epci


class AbstractEpciRepository(abc.ABC):
    @abc.abstractmethod
    def add_epcis(self, epcis: List[Epci]):
        raise NotImplementedError


class InMemoryEpciRepository(AbstractEpciRepository):
    def __init__(self, epcis: Optional[List[Epci]] = None) -> None:
        self.epcis = epcis or []

    def add_epcis(self, epcis: List[Epci]):
        self.epcis += epcis
