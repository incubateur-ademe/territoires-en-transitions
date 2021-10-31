import abc
from collections import defaultdict
from typing import Dict, List

from business.domain.models.action_score import ActionScore


class AbstractActionScoreRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_entities_for_epci(self, epci_id: str, entities=List[ActionScore]):
        raise NotImplementedError


class InMemoryActionScoreRepository(AbstractActionScoreRepository):
    def __init__(self) -> None:
        self._entities_by_epci: Dict[str, List[ActionScore]] = {}

    def add_entities_for_epci(self, epci_id: str, entities=List[ActionScore]):
        if epci_id not in self._entities_by_epci:
            self._entities_by_epci[epci_id] = []
        self._entities_by_epci[epci_id] += entities

    # For test purposes only
    def get_entities_for_epci(self, epci_id: str) -> List[ActionScore]:
        return self._entities_by_epci.get(epci_id, [])
