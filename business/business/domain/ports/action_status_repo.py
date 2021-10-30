import abc
from typing import List

from business.domain.models.action_status import ActionStatus


class AbstractActionStatusRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_entities(self, entities=List[ActionStatus]):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_for_epci(self, epci_id: str) -> List[ActionStatus]:
        raise NotImplementedError


class InMemoryActionStatusRepository(AbstractActionStatusRepository):
    def __init__(self, entities: List[ActionStatus] = None) -> None:
        self._entities = entities or []

    def add_entities(self, entities=List[ActionStatus]):
        self._entities += entities

    def get_all_for_epci(self, epci_id: str) -> List[ActionStatus]:
        return self._entities

    # For test purposes only
    @property
    def entities(self) -> List[ActionStatus]:
        return self._entities
