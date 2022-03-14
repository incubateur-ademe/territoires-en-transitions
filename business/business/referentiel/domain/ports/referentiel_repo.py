import abc
from dataclasses import dataclass
from typing import Dict, List, Optional

from ..models.action_children import ActionChildren
from ..models.action_definition import ActionDefinition
from ..models.action_computed_point import ActionComputedPoint
from ..models.indicateur import Indicateur, IndicateurId
from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.utils.action_id import ActionId


class AbstractReferentielRepository(abc.ABC):
    def __init__(self) -> None:
        pass

    @abc.abstractmethod
    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionComputedPoint],
    ):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_definitions_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionDefinition]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_points_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionComputedPoint]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_children_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionChildren]:
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_action_ids(
        self, referentiel: Optional[ActionReferentiel] = None
    ) -> List[ActionId]:
        raise NotImplementedError

    @abc.abstractmethod
    def upsert_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        raise NotImplementedError

    @abc.abstractmethod
    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        raise NotImplementedError

    @abc.abstractmethod
    def update_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        points: List[ActionComputedPoint],
    ):
        raise NotImplementedError


@dataclass
class ReferentielEntities:
    definitions: List[ActionDefinition]
    children: List[ActionChildren]
    points: List[ActionComputedPoint]


class InMemoryReferentielRepository(AbstractReferentielRepository):
    def __init__(
        self,
        children_entities: List[ActionChildren] = [],
        definition_entities: List[ActionDefinition] = [],
        points_entities: List[ActionComputedPoint] = [],
    ) -> None:
        self._actions_by_ref: Dict[ActionReferentiel, ReferentielEntities] = {}
        self._indicateurs: List[Indicateur] = []
        if children_entities and definition_entities and points_entities:
            self.add_referentiel_actions(
                definition_entities, children_entities, points_entities
            )

    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionComputedPoint],
    ):
        if not definitions:  # No entity to add
            return
        referentiel = definitions[0].referentiel
        if referentiel not in self._actions_by_ref:
            self._actions_by_ref[referentiel] = ReferentielEntities([], [], [])
        self._actions_by_ref[referentiel].definitions += definitions
        self._actions_by_ref[referentiel].children += children
        self._actions_by_ref[referentiel].points += points

    def get_all_definitions_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionDefinition]:
        if referentiel not in self._actions_by_ref:
            return []
        return self._actions_by_ref[referentiel].definitions

    def get_all_points_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionComputedPoint]:
        if referentiel not in self._actions_by_ref:
            return []
        return self._actions_by_ref[referentiel].points

    def get_all_children_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionChildren]:
        if referentiel not in self._actions_by_ref:
            return []
        return self._actions_by_ref[referentiel].children

    def get_all_action_ids(
        self, referentiel: Optional[ActionReferentiel] = None
    ) -> List[ActionId]:
        if referentiel:
            return self.get_all_action_ids_from_referentiel(referentiel)
        all_action_ids = []
        for referentiel in self._actions_by_ref:
            all_action_ids += self.get_all_action_ids_from_referentiel(referentiel)
        return all_action_ids

    def get_all_action_ids_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionId]:
        referentiel_entities = self._actions_by_ref.get(referentiel)
        if referentiel_entities is None:
            return []
        return [definition.action_id for definition in referentiel_entities.definitions]

    def upsert_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        self._indicateurs += indicateurs

    def update_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        points: List[ActionComputedPoint],
    ):
        if not definitions:  # No entity to update
            return
        new_definitions_by_id = {
            definition.action_id: definition for definition in definitions
        }
        new_points_by_id = {point.action_id: point for point in points}

        referentiel = definitions[0].referentiel
        if referentiel not in self._actions_by_ref:
            return

        self._actions_by_ref[referentiel].definitions = [
            old_def
            if old_def.action_id not in new_definitions_by_id
            else new_definitions_by_id[old_def.action_id]
            for old_def in self._actions_by_ref[referentiel].definitions
        ]
        self._actions_by_ref[referentiel].points = [
            old_point
            if old_point.action_id not in new_points_by_id
            else new_points_by_id[old_point.action_id]
            for old_point in self._actions_by_ref[referentiel].points
        ]

    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        return [indicateur.indicateur_id for indicateur in self._indicateurs]
