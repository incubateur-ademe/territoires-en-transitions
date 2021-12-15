import abc
from typing import Dict, List

from business.evaluation.domain.models.action_score import ActionScore


class AbstractActionScoreRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_entities_for_collectivite(
        self, collectivite_id: int, entities: List[ActionScore]
    ):
        raise NotImplementedError


class InMemoryActionScoreRepository(AbstractActionScoreRepository):
    def __init__(self) -> None:
        self._entities_by_collectivite: Dict[int, List[ActionScore]] = {}

    def add_entities_for_collectivite(
        self, collectivite_id: int, entities: List[ActionScore]
    ):
        if collectivite_id not in self._entities_by_collectivite:
            self._entities_by_collectivite[collectivite_id] = []
        self._entities_by_collectivite[collectivite_id] += entities

    # For test purposes only
    def get_entities_for_collectivite(self, collectivite_id: int) -> List[ActionScore]:
        return self._entities_by_collectivite.get(collectivite_id, [])
