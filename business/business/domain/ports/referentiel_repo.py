import abc
from dataclasses import dataclass
from typing import Dict, List

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


@dataclass
class ReferentielEntities:
    definitions: List[ActionDefinition]
    children: List[ActionChildren]
    points: List[ActionPoints]


class InMemoryReferentielRepository(AbstractReferentielRepository):
    def __init__(
        self,
        children_entities: List[ActionChildren] = None,
        definition_entities: List[ActionDefinition] = None,
        points_entities: List[ActionPoints] = None,
    ) -> None:
        self.referentiels: Dict[ReferentielId, ReferentielEntities] = {}
        self._children_entities = children_entities or []
        self._definition_entities = definition_entities or []
        self._points_entities = points_entities or []

    def add_referentiel(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionPoints],
    ):
        if not definitions:  # No entity to add
            return
        referentiel_id = definitions[0].referentiel_id
        if referentiel_id not in self.referentiels:
            self.referentiels[referentiel_id] = ReferentielEntities([], [], [])
        self.referentiels[referentiel_id].definitions += definitions
        self.referentiels[referentiel_id].children += children
        self.referentiels[referentiel_id].points += points

    def get_all_points_from_referentiel(
        self, referentiel_id: ReferentielId
    ) -> List[ActionPoints]:
        if referentiel_id not in self.referentiels:
            return []
        return self.referentiels[referentiel_id].points

    def get_all_children_from_referentiel(
        self, referentiel_id: ReferentielId
    ) -> List[ActionChildren]:
        if referentiel_id not in self.referentiels:
            return []
        return self.referentiels[referentiel_id].children
