import os
from typing import List
from pathlib import Path
from business.referentiel.domain.models.action_relation import ActionRelation
from business.referentiel.domain.models.personnalisation import (
    ActionPersonnalisationRegles,
)
from business.referentiel.domain.models.question import Question

from business.referentiel.domain.ports.referentiel_repo import (
    InMemoryReferentielRepository,
)
from business.referentiel.domain.models.action_definition import ActionDefinition
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.referentiel.domain.models.indicateur import Indicateur
from business.referentiel.adapters.make_sql import (
    make_sql_insert_indicateurs,
    make_sql_insert_actions,
)


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
        relations: List[ActionRelation],
        points: List[ActionComputedPoint],
    ):
        super().add_referentiel_actions(definitions, relations, points)
        self.actions_to_sql()

    def add_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        super().upsert_indicateurs(indicateurs)
        self.indicateurs_to_sql()

    def upsert_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        super().upsert_indicateurs(indicateurs)
        self.indicateurs_to_sql()

    def upsert_questions(
        self,
        questions: List[Question],
    ):
        raise NotImplementedError

    def replace_personnalisations(
        self,
        personnalisations: List[ActionPersonnalisationRegles],
    ):
        raise NotImplementedError

    def get_questions(
        self,
    ) -> List[Question]:
        raise NotImplementedError

    def get_personnalisations(
        self,
    ) -> List[ActionPersonnalisationRegles]:
        raise NotImplementedError

    def indicateurs_to_sql(self):
        sql = make_sql_insert_indicateurs(self._indicateurs)
        with open(self.path, "a") as f:
            f.write(f"{sql}\n")

    def actions_to_sql(self):
        sql = make_sql_insert_actions(self._actions_by_ref)
        with open(self.path, "a") as f:
            f.write(f"{sql}\n")

    def from_sql(self):
        self._actions_by_ref = {}
        self._indicateurs = []
        self._preuves = []
