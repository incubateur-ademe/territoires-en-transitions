from typing import List

from supabase.client import Client

from business.core.domain.models.referentiel import ActionReferentiel
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.referentiel.domain.models.action_children import ActionChildren
from business.referentiel.domain.models.action_definition import ActionDefinition
from business.referentiel.domain.models.action_computed_point import ActionComputedPoint
from business.referentiel.domain.models.indicateur import Indicateur, IndicateurId
from business.utils.action_id import ActionId


class SupabaseError(Exception):
    pass


class SupabaseReferentielRepository(AbstractReferentielRepository):
    def __init__(self, supabase_client: Client) -> None:
        self.supabase_client = supabase_client

    def get_all_definitions_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionDefinition]:
        result = (
            self.supabase_client.table("action_definition")
            .select("*")  # type: ignore
            .eq("referentiel", referentiel)
            .execute()
        )
        if not result["status_code"] == 200:
            raise SupabaseError(str(result["data"]))
        rows = result["data"]

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
                points=row["points"],
                pourcentage=row["pourcentage"],
            )
            for row in rows
        ]

    def get_all_points_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> List[ActionComputedPoint]:
        result = (
            self.supabase_client.table("action_computed_points")
            .select("*")  # type: ignore
            .like(
                "action_id", f"{referentiel}*"
            )  # TODO : find a better way to infer the referentiel (make a view ? )
            .execute()
        )
        if not result["status_code"] == 200:
            raise SupabaseError(str(result["data"]))
        rows = result["data"]

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
        result = (
            self.supabase_client.table("action_children")
            .select("*")  # type: ignore
            .eq("referentiel", referentiel)
            .execute()
        )
        if not result["status_code"] == 200:
            raise SupabaseError(str(result["data"]))
        rows = result["data"]

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
        result = (
            self.supabase_client.table("action_relation")
            .select("id")  # type: ignore
            .eq("referentiel", referentiel)
            .execute()
        )
        if not result["status_code"] == 200:
            raise SupabaseError(str(result["data"]))
        rows = result["data"]

        return [row["id"] for row in rows]

    def get_all_indicateur_ids(
        self,
    ) -> List[IndicateurId]:
        result = (
            self.supabase_client.table("indicateur_definition").select("id").execute()  # type: ignore
        )
        if not result["status_code"] == 200:
            raise SupabaseError(str(result["data"]))
        rows = result["data"]

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
        raise NotImplementedError
