from typing import List

# from supabase.client import Client
from supabase_client import Client
from supabase_client.supabase_client import TableClient

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
    async def get_all_definitions_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionDefinition]:
        result = await (
            self.supabase_client.table("action_definition")
            .select("*")
            .eq("referentiel", referentiel)
            .query()
        )
        if not result:
            raise SupabaseError()
        error, rows = result
        if error or not rows:
            raise SupabaseError(error)

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

    async def get_all_points_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionComputedPoint]:
        result = await (
            self.supabase_client.table("action_computed_points")
            .select("*")
            .like(
                "action_id", f"{referentiel}%"
            )  # TODO : find a better way to infer the referentiel (make a view ? )
            .query()
        )
        if not result:
            raise SupabaseError()
        error, rows = result
        if error or not rows:
            raise SupabaseError(error)

        return [
            ActionComputedPoint(
                referentiel=referentiel,
                action_id=row["action_id"],
                value=row["value"],
            )
            for row in rows
        ]

    async def get_all_children_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionChildren]:
        result = await (
            self.supabase_client.table("business_action_children")
            .select("*")
            .eq("referentiel", referentiel)
            .query()
        )
        if not result:
            raise SupabaseError()
        error, rows = result
        if error or not rows:
            raise SupabaseError(error)

        return [
            ActionChildren(
                referentiel=row["referentiel"],
                action_id=row["id"],
                children=row["children"] or [],
            )
            for row in rows
        ]

    async def get_all_action_ids_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionId]:
        result = await (
            self.supabase_client.table("action_relation")
            .select("id")
            .eq("referentiel", referentiel)
            .query()
        )
        if not result:
            raise SupabaseError()
        error, rows = result
        if error or not rows:
            raise SupabaseError(error)

        return [row["id"] for row in rows]

    async def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        result = await self.indicateur_definition_table.select("id").query()
        if not result:
            raise SupabaseError()
        error, rows = result
        if error or not rows:
            raise SupabaseError(error)

        return [row["id"] for row in rows]

    def add_referentiel_actions(
        self,
        definitions: List[ActionDefinition],
        children: List[ActionChildren],
        points: List[ActionComputedPoint],
    ):
        raise NotImplementedError

    async def add_indicateurs(
        self,
        indicateurs: List[Indicateur],
    ):
        result = await self.indicateur_definition_table.insert(
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
            ]
        )
        if not result:
            raise SupabaseError()
        error, rows = result
        if error or not rows:
            raise SupabaseError(error)

    @property
    def indicateur_definition_table(self) -> TableClient:
        return self.supabase_client.table(supabase_table_names.indicateur_definition)
