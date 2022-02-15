from typing import List


from business.core.domain.models.referentiel import ActionReferentiel
from business.evaluation.adapters import supabase_table_names
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_definition import ActionDefinition
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.referentiel.domain.models.indicateur import Indicateur, IndicateurId
from business.utils.action_id import ActionId
from business.utils.supabase_repo import SupabaseError, SupabaseRepository


class SupabaseReferentielRepository(SupabaseRepository, AbstractReferentielRepository):
    def get_all_definitions_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionDefinition]:
        rows = self.supabase_client.db.get_by(
            supabase_table_names.action_definition,
            filters={
                "referentiel": f"eq.{referentiel}",
            },
        )
        return [
            ActionDefinition(
                action_id=row["action_id"],
                referentiel=row["referentiel"],
                identifiant=row["identifiant"],
                nom=row["nom"],
                description=row["description"],
                contexte=row["contexte"],
                exemples=row["exemples"],
                preuve=row["preuve"],
                ressources=row["ressources"],
                points=row["points"],
                pourcentage=row["pourcentage"],
            )
            for row in rows
        ]

    def get_all_points_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionComputedPoint]:
        rows = self.supabase_client.db.get_by(
            supabase_table_names.action_computed_points,
            filters={
                "action_id": f"like.{referentiel}%",  # TODO : find a better way to infer the referentiel (make a view ? )
            },
        )

        return [
            ActionComputedPoint(
                referentiel=referentiel,
                action_id=row["action_id"],
                value=row["value"],
            )
            for row in rows
        ]

    def get_all_children_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionChildren]:
        rows = self.supabase_client.db.get_by(
            supabase_table_names.business_action_children,
            filters={"referentiel": f"eq.{referentiel}"},
        )

        return [
            ActionChildren(
                referentiel=row["referentiel"],
                action_id=row["id"],
                children=row["children"] or [],
            )
            for row in rows
        ]

    def get_all_action_ids_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionId]:
        rows = self.supabase_client.db.get_by(
            supabase_table_names.action_relation,
            filters={"referentiel": f"eq.{referentiel}"},
        )
        return [row["id"] for row in rows]

    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        rows = self.supabase_client.db.get_all(
            supabase_table_names.indicateur_definition
        )

        return [row["id"] for row in rows]

    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionComputedPoint],
    ):
        raise NotImplementedError

    def add_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        self.supabase_client.db.insert_many(
            supabase_table_names.indicateur_definition,
            [
                {
                    "id": indicateur.indicateur_id,
                    "identifiant": indicateur.identifiant,
                    "indicateur_group": indicateur.indicateur_group,
                    "nom": indicateur.nom,
                    "unite": indicateur.unite,
                    "description": indicateur.description,
                    "valeur_indicateur": indicateur.valeur_indicateur,
                    "obligation_eci": indicateur.obligation_eci,
                }
                for indicateur in indicateurs
            ],
        )
