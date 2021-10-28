import abc
from typing import List

from business.domain.models.action_statut import ActionStatut


class AbstractActionStatutRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_entities(self, entities=List[ActionStatut]):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_for_epci(self, epci_id: int) -> List[ActionStatut]:
        raise NotImplementedError


class InMemoryActionStatutRepository(AbstractActionStatutRepository):
    def __init__(self, entities: List[ActionStatut] = None) -> None:
        self._entities = entities or []

    def add_entities(self, entities=List[ActionStatut]):
        self._entities += entities

    def get_all_for_epci(self, epci_id: int) -> List[ActionStatut]:
        return self._entities

    # For test purposes only
    @property
    def entities(self) -> List[ActionStatut]:
        return self._entities
