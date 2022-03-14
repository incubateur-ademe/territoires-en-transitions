from typing import List, Optional


from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.evaluation.adapters import supabase_names
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_definition import ActionDefinition
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.referentiel.domain.models.indicateur import Indicateur, IndicateurId
from business.utils.action_id import ActionId
from business.utils.supabase_repo import SupabaseRepository


class SupabaseReferentielRepository(SupabaseRepository, AbstractReferentielRepository):
    def get_all_definitions_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionDefinition]:
        rows = self.client.db.get_by(
            supabase_names.tables.action_definition,
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
                reduction_potentiel=row["reduction_potentiel"],
                perimetre_evaluation=row["perimetre_evaluation"],
                points=row["points"],
                pourcentage=row["pourcentage"],
            )
            for row in rows
        ]

    def get_all_points_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionComputedPoint]:
        rows = self.client.db.get_by(
            supabase_names.tables.action_computed_points,
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
        rows = self.client.db.get_by(
            supabase_names.views.action_children,
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

    def get_all_action_ids(
        self, referentiel: Optional[ActionReferentiel] = None
    ) -> List[ActionId]:
        rows = self.client.db.get_by(
            supabase_names.tables.action_relation,
            filters={"referentiel": f"eq.{referentiel}"} if referentiel else {},
        )
        return [row["id"] for row in rows]

    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        rows = self.client.db.get_all(supabase_names.tables.indicateur_definition)

        return [row["id"] for row in rows]

    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionComputedPoint],
    ):
        raise NotImplementedError

    def upsert_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        self.client.rpc.call(
            supabase_names.rpc.upsert_indicateurs,
            indicateur_definitions=[
                {
                    "id": indicateur.indicateur_id,
                    "identifiant": indicateur.identifiant,
                    "indicateur_group": indicateur.indicateur_group,
                    "nom": indicateur.nom,
                    "unite": indicateur.unite,
                    "description": indicateur.description,
                    "valeur_indicateur": indicateur.valeur_indicateur,
                    "obligation_eci": indicateur.obligation_eci,
                    "parent": None,
                }
                for indicateur in indicateurs
            ],
            indicateur_actions=self.flatten_list(
                [
                    [
                        {
                            "indicateur_id": indicateur.indicateur_id,
                            "action_id": action_id,
                        }
                        for action_id in indicateur.action_ids
                    ]
                    for indicateur in indicateurs
                ]
            ),
        )

    def update_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        points: List[ActionComputedPoint],
    ):
        self.client.rpc.call(
            supabase_names.rpc.update_actions,
            definitions=[
                {
                    "action_id": definition.action_id,
                    "referentiel": definition.referentiel,
                    "identifiant": definition.identifiant,
                    "nom": definition.nom,
                    "description": definition.description,
                    "contexte": definition.contexte,
                    "exemples": definition.exemples,
                    "preuve": definition.preuve,
                    "ressources": definition.ressources,
                    "perimetre_evaluation": definition.perimetre_evaluation,
                    "reduction_potentiel": definition.reduction_potentiel,
                    "points": definition.points,
                    "pourcentage": definition.pourcentage,
                }
                for definition in definitions
            ],
            computed_points=[
                {
                    "action_id": point.action_id,
                    "value": point.value,
                }
                for point in points
            ],
        )

    @staticmethod
    def flatten_list(l: List) -> List:
        return [item for sublist in l for item in sublist]
