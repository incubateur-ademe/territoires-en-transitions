from dataclasses import asdict
import json
import os
from pathlib import Path
from typing import List
from business.referentiel.domain.models.action_relation import ActionRelation


from business.referentiel.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
    ReferentielEntities,
)
from business.referentiel.domain.models.indicateur import Indicateur
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_definition import ActionDefinition
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.utils.dataclass_from_dict import dataclass_from_dict


class JsonReferentielRepository(InMemoryReferentielRepository):
    def __init__(self, path: Path) -> None:
        try:
            os.mkdir(path.parent)
        except FileExistsError:
            pass

        self.path = path
        self.from_json()

    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        relations: List[ActionRelation],
        points: List[ActionComputedPoint],
    ):
        super().add_referentiel_actions(definitions, relations, points)
        self.to_json()

    def upsert_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        super().upsert_indicateurs(indicateurs)
        self.to_json()

    def to_json(self):
        serialized_indicateurs = [
            asdict(indicateur) for indicateur in self._indicateurs
        ]
        serialized_referentiels_actions = {}
        for referentiel, referentiel_entities in self._actions_by_ref.items():
            serialized_referentiel = {
                "definitions": [
                    asdict(definition)
                    for definition in referentiel_entities.definitions
                ],
                "points": [asdict(points) for points in referentiel_entities.points],
                "children": [
                    asdict(children) for children in referentiel_entities.children
                ],
            }
            serialized_referentiels_actions[referentiel] = serialized_referentiel

        serialized_repo = {
            "actions": serialized_referentiels_actions,
            "indicateurs": serialized_indicateurs,
        }
        with open(self.path, "w") as f:
            json.dump(serialized_repo, f)

    def from_json(self):

        self._actions_by_ref = {}
        self._indicateurs: List[Indicateur] = []

        if not os.path.isfile(self.path):
            return

        with open(self.path, "r") as f:
            serialized_referentiel = json.load(f)

        # load indicateurs
        serialized_indicateurs = serialized_referentiel["indicateurs"]
        self._indicateurs = [
            dataclass_from_dict(Indicateur, indicateur_as_dict, use_marshmallow=True)
            for indicateur_as_dict in serialized_indicateurs
        ]
        # load actions
        serialized_actions = serialized_referentiel["actions"]
        for referentiel, action_entities in serialized_actions.items():
            definition_entities = [
                dataclass_from_dict(
                    ActionDefinition, serialized_definition, use_marshmallow=True
                )
                for serialized_definition in action_entities["definitions"]
            ]
            children_entities = [
                dataclass_from_dict(
                    ActionChildren, serialized_children, use_marshmallow=True
                )
                for serialized_children in action_entities["children"]
            ]
            points_entities = [
                dataclass_from_dict(
                    ActionComputedPoint, serialized_points, use_marshmallow=True
                )
                for serialized_points in action_entities["points"]
            ]
            self._actions_by_ref[referentiel] = ReferentielEntities(
                definition_entities, children_entities, points_entities
            )
