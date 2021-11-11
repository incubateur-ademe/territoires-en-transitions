from dataclasses import asdict
from functools import cmp_to_key

from business.domain.models import commands
from business.domain.models.action_definition import ActionDefinition
from business.domain.ports.referentiel_repo import AbstractReferentielRepository

from .use_case import UseCase


class ExtractReferentielActionsToCsv(UseCase):
    def __init__(
        self,
        referentiel_repo: AbstractReferentielRepository,
    ) -> None:
        self.referentiel_repo = referentiel_repo

    def execute(self, command: commands.ExtractReferentielActionsToCsv):
        # definitions = self.referentiel_repo.get_all_definitions_from_referentiel(
        #     command.referentiel
        # )

        # sorted_definitions = sorted(
        #     definitions, key=cmp_to_key(self.compare_definition_identifiants)
        # )
        # sorted_action_ids = [definition.action_id for definition in sorted_definitions]
        points_by_id = {
            str(points.action_id): asdict(points)
            for points in self.referentiel_repo.get_all_points_from_referentiel(
                command.referentiel
            )
        }

        definitions_by_id = {
            str(definitions.action_id): asdict(definitions)
            for definitions in self.referentiel_repo.get_all_definitions_from_referentiel(
                command.referentiel
            )
        }
        import pandas as pd

        columns = ["identifiant", "nom", "value"]
        df = pd.concat([pd.DataFrame(points_by_id), pd.DataFrame(definitions_by_id)]).T[
            columns
        ]
        df_sorted = df.sort_values(
            by="identifiant",
            # key=cmp_to_key(self.compare_definition_identifiants),
        )
        df_sorted.to_csv(command.csv_path)

    # @staticmethod
    # def compare_definition_identifiants(
    #     definition_a: ActionDefinition, definition_b: ActionDefinition
    # ) -> int:
    #     breakpoint()
    #     identifiant_a = definition_a.identifiant
    #     identifiant_b = definition_b.identifiant

    #     if identifiant_a == identifiant_b:
    #         return 0

    #     identifiant_a_array = identifiant_a.split(".")
    #     identifiant_b_array = identifiant_b.split(".")

    #     for k in range(min(len(identifiant_a_array), len(identifiant_b_array))):
    #         index_a = identifiant_a_array[k]
    #         index_b = identifiant_b_array[k]

    #         if index_a < index_b:
    #             return -1
    #         elif index_a > index_b:
    #             return 1
    #     # this means that the two identifiant have same root. Then parent is the one with shorter length.
    #     return -1 if len(identifiant_a_array) < len(identifiant_b_array) else 1
