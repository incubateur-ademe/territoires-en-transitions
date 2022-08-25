from typing import List, Optional
from dataclasses import asdict

import marshmallow_dataclass
from business.referentiel.domain.models.action_relation import ActionRelation

from business.referentiel.domain.models.personnalisation import (
    ActionPersonnalisationRegles,
)
from business.referentiel.domain.models.question import Question
from business.personnalisation.models import Question as EngineQuestion
from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.evaluation.adapters import supabase_names
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_definition import ActionDefinition
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.referentiel.domain.models.indicateur import Indicateur, IndicateurId
from business.referentiel.domain.models.preuve import Preuve
from business.utils.action_id import ActionId
from business.utils.supabase_repo import SupabaseRepository


question_schema = marshmallow_dataclass.class_schema(Question)()
personnalisation_schema = marshmallow_dataclass.class_schema(
    ActionPersonnalisationRegles
)()


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
                ressources=row["ressources"],
                reduction_potentiel=row["reduction_potentiel"],
                perimetre_evaluation=row["perimetre_evaluation"],
                points=row["points"],
                pourcentage=row["pourcentage"],
                categorie=row["categorie"],
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
        relations: List[ActionRelation],
        points: List[ActionComputedPoint],
    ):
        self.client.rpc.call(
            supabase_names.rpc.insert_actions,
            relations=[
                {
                    "id": relation.id,
                    "referentiel": relation.referentiel,
                    "parent": relation.parent,
                }
                for relation in relations
            ],
            definitions=[
                {
                    "action_id": definition.action_id,
                    "referentiel": definition.referentiel,
                    "identifiant": definition.identifiant,
                    "nom": definition.nom,
                    "description": definition.description,
                    "contexte": definition.contexte,
                    "exemples": definition.exemples,
                    "ressources": definition.ressources,
                    "perimetre_evaluation": definition.perimetre_evaluation,
                    "reduction_potentiel": definition.reduction_potentiel,
                    "points": definition.points,
                    "pourcentage": definition.pourcentage,
                    "categorie": definition.categorie,
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

    def upsert_preuves(
        self,
        preuves: List[Preuve],
    ):
        self.client.rpc.call(
            supabase_names.rpc.upsert_preuves,
            preuve_definitions=[
                {
                    "id": preuve.id,
                    "nom": preuve.nom,
                    "action_id": preuve.action_id,
                    "description": preuve.description,
                }
                for preuve in preuves
            ],
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
                    "ressources": definition.ressources,
                    "perimetre_evaluation": definition.perimetre_evaluation,
                    "reduction_potentiel": definition.reduction_potentiel,
                    "points": definition.points,
                    "pourcentage": definition.pourcentage,
                    "categorie": definition.categorie,
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

    def upsert_questions(
        self,
        questions: List[Question],
    ):
        questions_as_dict = [asdict(question) for question in questions]
        self.client.rpc.call(
            supabase_names.rpc.upsert_questions,
            questions=questions_as_dict,
        )

    def replace_personnalisations(
        self,
        personnalisations: List[ActionPersonnalisationRegles],
    ):
        personnalisation_as_dicts = [
            asdict(personnalisation) for personnalisation in personnalisations
        ]
        self.client.rpc.call(
            supabase_names.rpc.business_replace_personnalisations,
            personnalisations=personnalisation_as_dicts,
        )

    def get_all_engine_questions(
        self,
    ) -> List[EngineQuestion]:
        rows = self.client.db.get_all(supabase_names.views.engine_question)
        return [
            EngineQuestion(row["id"], row["type"], row["choix_ids"]) for row in rows
        ]

    def get_personnalisations(
        self,
    ) -> List[ActionPersonnalisationRegles]:
        rows = self.client.db.get_all(supabase_names.views.personnalisation)
        return [ActionPersonnalisationRegles.from_dict(row) for row in rows]

    @staticmethod
    def flatten_list(l: List) -> List:
        return [item for sublist in l for item in sublist]
