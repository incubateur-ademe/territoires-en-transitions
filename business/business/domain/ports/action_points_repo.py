import abc
from typing import List

from business.domain.models.action_points import ActionPoints
from business.domain.models.litterals import ReferentielId
from business.utils.action_id import retrieve_referentiel_id

class AbstractActionPointsRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_entities(self, entities=List[ActionPoints]):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_from_referentiel(self, referentiel_id: ReferentielId) -> List[ActionPoints]:
        raise NotImplementedError


class InMemoryActionPointsRepository(AbstractActionPointsRepository):
    def __init__(self, entities: List[ActionPoints] = None) -> None:
        self._entities = entities or []

    def add_entities(self, entities=List[ActionPoints]):
        self._entities += entities

    def get_all_from_referentiel(self, referentiel_id: ReferentielId) -> List[ActionPoints]:
        return [entity for entity in self._entities if retrieve_referentiel_id(entity.action_id) == referentiel_id]

    # For test purposes only
    @property
    def entities(self) -> List[ActionPoints]:
        return self._entities
