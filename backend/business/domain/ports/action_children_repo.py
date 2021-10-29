import abc
from typing import List

from backend.domain.models.action_children import ActionChildren


class AbstractActionChildrenRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_entities(self, entities=List[ActionChildren]):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all(self) -> List[ActionChildren]:
        raise NotImplementedError


class InMemoryActionChildrenRepository(AbstractActionChildrenRepository):
    def __init__(self, entities: List[ActionChildren] = None) -> None:
        self._entities = entities or []

    def add_entities(self, entities=List[ActionChildren]):
        self._entities += entities

    def get_all(self) -> List[ActionChildren]:
        return self._entities

    # For test purposes only
    @property
    def entities(self) -> List[ActionChildren]:
        return self._entities
