from business.evaluation.adapters import supabase_names
from business.evaluation.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.utils.models.actions import (
    ActionChildren,
    ActionComputedPoint,
    ActionReferentiel,
)
from business.utils.supabase_repo import SupabaseRepository


class SupabaseReferentielRepository(SupabaseRepository, AbstractReferentielRepository):
    def get_all_points_from_referentiel(
        self, referentiel: ActionReferentiel
    ) -> list[ActionComputedPoint]:
        rows = self.client.db.get_by(
            supabase_names.tables.action_computed_points,
            filters={
                "action_id": f"like.{referentiel}%",
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
    ) -> list[ActionChildren]:
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
