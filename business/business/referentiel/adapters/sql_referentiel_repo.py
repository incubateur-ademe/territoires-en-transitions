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
        self.actions_to_sql()

    def add_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        super().add_indicateurs(indicateurs)
        self.indicateurs_to_sql()

    def indicateurs_to_sql(self):
        with open(self.path, "a") as f:
            for indicateur_def in self._indicateurs:
                sql = f"insert into indicateur_definition(id, indicateur_group, identifiant, valeur_indicateur, nom, description, unite, obligation_eci, parent) values ('{indicateur_def.indicateur_id}', '{indicateur_def.indicateur_group}', '{indicateur_def.identifiant}', {f'{indicateur_def.values_refers_to}' if indicateur_def.values_refers_to else 'null'}, '{self.format_text(indicateur_def.nom)}', '{self.format_text(indicateur_def.description)}', '{self.format_text(indicateur_def.unite)}', {str(indicateur_def.obligation_eci).lower()} ,   null);"
                f.write(f"{sql}\n")

    def actions_to_sql(self):
        self.write_sql_for_action_relation()
        self.write_sql_for_action_definition()
        self.write_sql_for_action_computed_points()

    def write_sql_for_action_relation(self):
        with open(self.path, "a") as f:
            for referentiel, referentiel_entities in self._actions_by_ref.items():
                for children in referentiel_entities.children:
                    if len(children.action_id.split("_")) == 1:  # root action
                        sql = f"insert into action_relation(id, referentiel, parent) values ('{children.action_id}', '{referentiel}', null);"
                        f.write(f"{sql}\n")
                    for child_id in children.children_ids:
                        sql = f"insert into action_relation(id, referentiel, parent) values ('{child_id}', '{referentiel}', '{children.action_id}');"
                        f.write(f"{sql}\n")

    def write_sql_for_action_computed_points(self):
        with open(self.path, "a") as f:
            for referentiel, referentiel_entities in self._actions_by_ref.items():
                for points in referentiel_entities.points:
                    sql = f"insert into action_computed_points(action_id, value) values ('{points.action_id}', '{points.value}');"
                    f.write(f"{sql}\n")

    def write_sql_for_action_definition(self):
        with open(self.path, "a") as f:
            for referentiel, referentiel_entities in self._actions_by_ref.items():
                for definition in referentiel_entities.definitions:
                    sql = f"insert into action_definition(action_id, referentiel, identifiant, nom, description, contexte, exemples, ressources, points, pourcentage) values ('{definition.action_id}', '{definition.referentiel}', '{definition.identifiant}', '{self.format_text(definition.nom)}', '{self.format_text(definition.description)}', '{self.format_text(definition.contexte)}', '{self.format_text(definition.exemples)}', '{self.format_text(definition.ressources)}', {definition.points or 'null'}, {definition.pourcentage or 'null'});"
                    f.write(f"{sql}\n")

    def from_sql(self):  # TODO ?
        self._actions_by_ref = {}
        self._indicateurs = []

    @staticmethod
    def format_text(text: str):
        return text.replace("'", "''")
