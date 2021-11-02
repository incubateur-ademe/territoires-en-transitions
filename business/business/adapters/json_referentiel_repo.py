from dataclasses import asdict
import json
from pathlib import Path
from typing import List
import os

from business.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
    ReferentielEntities,
)
from business.domain.models.action_children import ActionChildren
from business.domain.models.action_definition import ActionDefinition
from business.domain.models.action_points import ActionPoints


class JsonReferentielRepository(InMemoryReferentielRepository):
    def __init__(self, path: Path) -> None:
        try:
            os.mkdir(path.parent)
        except FileExistsError:
            pass

        self.path = path
        self.from_json()

    def add_referentiel(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionPoints],
    ):
        super().add_referentiel(definitions, children, points)
        self.to_json()

    def to_json(self):
        serialized_referentiels = {}
        for referentiel_id, referentiel_entities in self.referentiels.items():
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
            serialized_referentiels[referentiel_id] = serialized_referentiel

        with open(self.path, "w") as f:
            json.dump(serialized_referentiels, f)

    def from_json(self):

        self.referentiels = {}
        if not os.path.isfile(self.path):
            return

        with open(self.path, "r") as f:
            serialized_referentiel = json.load(f)

        for referentiel_id, referentiel_entities in serialized_referentiel.items():
            definition_entities = [
                ActionDefinition(**serialized_definition)
                for serialized_definition in referentiel_entities["definitions"]
            ]
            children_entities = [
                ActionChildren(**serialized_children)
                for serialized_children in referentiel_entities["children"]
            ]
            points_entities = [
                ActionPoints(**serialized_points)
                for serialized_points in referentiel_entities["points"]
            ]
            self.referentiels[referentiel_id] = ReferentielEntities(
                definition_entities, children_entities, points_entities
            )
