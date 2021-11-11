import abc
from dataclasses import dataclass
from typing import Dict, List

from business.domain.models.action_children import ActionChildren
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_points import ActionPoints
from business.domain.models.litterals import Referentiel
from business.utils.action_id import ActionId


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
        self, referentiel: Referentiel
    ) -> List[ActionPoints]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_children_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionChildren]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_action_ids_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionId]:
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
        self.referentiels: Dict[Referentiel, ReferentielEntities] = {}

        if children_entities and definition_entities and points_entities:
            self.add_referentiel(
                definition_entities, children_entities, points_entities
            )

    def add_referentiel(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionPoints],
    ):
        if not definitions:  # No entity to add
            return
        referentiel = definitions[0].referentiel
        if referentiel not in self.referentiels:
            self.referentiels[referentiel] = ReferentielEntities([], [], [])
        self.referentiels[referentiel].definitions += definitions
        self.referentiels[referentiel].children += children
        self.referentiels[referentiel].points += points

    def get_all_points_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionPoints]:
        if referentiel not in self.referentiels:
            return []
        return self.referentiels[referentiel].points

    def get_all_children_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionChildren]:
        if referentiel not in self.referentiels:
            return []
        return self.referentiels[referentiel].children

    def get_all_action_ids_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionId]:
        referentiel_entities = self.referentiels.get(referentiel)
        if referentiel_entities is None:
            return []
        return [definition.action_id for definition in referentiel_entities.definitions]
