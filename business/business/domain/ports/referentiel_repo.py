import abc
from dataclasses import dataclass
from typing import Dict, List

from business.domain.models.action_children import ActionChildren
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_points import ActionPoints
from business.domain.models.indicateur import Indicateur, IndicateurId
from business.domain.models.litterals import Referentiel
from business.utils.action_id import ActionId


class AbstractReferentielRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_referentiel_actions(
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

    @abc.abstractmethod
    def add_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
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
        self._actions_by_ref: Dict[Referentiel, ReferentielEntities] = {}
        self._indicateurs: List[Indicateur] = []
        if children_entities and definition_entities and points_entities:
            self.add_referentiel_actions(
                definition_entities, children_entities, points_entities
            )

    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionPoints],
    ):
        if not definitions:  # No entity to add
            return
        referentiel = definitions[0].referentiel
        if referentiel not in self._actions_by_ref:
            self._actions_by_ref[referentiel] = ReferentielEntities([], [], [])
        self._actions_by_ref[referentiel].definitions += definitions
        self._actions_by_ref[referentiel].children += children
        self._actions_by_ref[referentiel].points += points

    def get_all_points_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionPoints]:
        if referentiel not in self._actions_by_ref:
            return []
        return self._actions_by_ref[referentiel].points

    def get_all_children_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionChildren]:
        if referentiel not in self._actions_by_ref:
            return []
        return self._actions_by_ref[referentiel].children

    def get_all_action_ids_from_referentiel(
        self, referentiel: Referentiel
    ) -> List[ActionId]:
        referentiel_entities = self._actions_by_ref.get(referentiel)
        if referentiel_entities is None:
            return []
        return [definition.action_id for definition in referentiel_entities.definitions]

    def add_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        self._indicateurs += indicateurs

    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        return [indicateur.indicateur_id for indicateur in self._indicateurs]
