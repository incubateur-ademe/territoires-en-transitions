import abc
from typing import List

from business.domain.models.action_points import ActionPoints


class AbstractActionPointsRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_entities(self, entities=List[ActionPoints]):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all(self) -> List[ActionPoints]:
        raise NotImplementedError


class InMemoryActionPointsRepository(AbstractActionPointsRepository):
    def __init__(self, entities: List[ActionPoints] = None) -> None:
        self._entities = entities or []

    def add_entities(self, entities=List[ActionPoints]):
        self._entities += entities

    def get_all(self) -> List[ActionPoints]:
        return self._entities

    # For test purposes only
    @property
    def entities(self) -> List[ActionPoints]:
        return self._entities
