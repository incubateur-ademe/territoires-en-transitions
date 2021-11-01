import abc
from typing import List

from business.domain.models.action_children import ActionChildren
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_points import ActionPoints
from business.domain.models.litterals import ReferentielId
from business.utils.action_id import retrieve_referentiel_id


class AbstractReferentielRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_referentiel(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionPoints],
    ):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_points_from_referentiel(
        self, referentiel_id: ReferentielId
    ) -> List[ActionPoints]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_children_from_referentiel(
        self, referentiel_id: ReferentielId
    ) -> List[ActionChildren]:
        raise NotImplementedError


class InMemoryReferentielRepository(AbstractReferentielRepository):
    def __init__(self, entities: List[ActionChildren] = None) -> None:
        self._entities = entities or []

    def add_referentiel(self, entities=List[ActionChildren]):
        self._entities += entities

    def get_all_from_referentiel(
        self, referentiel_id: ReferentielId
    ) -> List[ActionChildren]:
        return [
            entity
            for entity in self._entities
            if retrieve_referentiel_id(entity.action_id) == referentiel_id
        ]

    # For test purposes only
    @property
    def entities(self) -> List[ActionChildren]:
        return self._entities
