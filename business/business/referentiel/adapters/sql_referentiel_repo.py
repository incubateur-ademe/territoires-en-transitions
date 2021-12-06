import os
from typing import List
from pathlib import Path

from business.referentiel.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
)
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_definition import ActionDefinition
from business.referentiel.domain.models.action_points import ActionPoints
from business.referentiel.domain.models.indicateur import Indicateur


class SqlReferentielRepository(InMemoryReferentielRepository):
    def __init__(self, path: Path) -> None:
        try:
            os.mkdir(path.parent)
        except FileExistsError:
            pass

        self.path = path
        self.from_sql()

    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionPoints],
    ):
        super().add_referentiel_actions(definitions, children, points)
        self.to_sql()

    def add_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        super().add_indicateurs(indicateurs)
        self.to_sql()

    def to_sql(self):
        with open(self.path, "w") as f:
            for referentiel, referentiel_entities in self._actions_by_ref.items():
                for children in referentiel_entities.children:
                    if referentiel == children.action_id:
                        sql = f"insert into action_relation(id, referentiel, parent) values ('{children.action_id}', '{referentiel}', null);"
                        f.write(f"{sql}\n")
                    for child_id in children.children_ids:
                        sql = f"insert into action_relation(id, referentiel, parent) values ('{child_id}', '{referentiel}', '{children.action_id}');"
                        f.write(f"{sql}\n")

    def from_sql(self):  # TODO !
        self._actions_by_ref = {}
