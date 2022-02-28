from typing import List

from business.referentiel.domain.models.referentiel import ActionReferentiel
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
)
from business.evaluation.adapters import supabase_names
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
    ActionId,
    ActionStatutAvancement,
)
from business.utils.supabase_repo import SupabaseRepository


class SupabaseActionStatutRepository(
    SupabaseRepository,
    AbstractActionStatutRepository,
):
    def get_all_for_collectivite(
        self, collectivite_id: int, referentiel: ActionReferentiel
    ) -> List[ActionStatut]:
        rows = self.client.db.get_by(
            supabase_names.views.action_statut,
            filters={
                "collectivite_id": f"eq.{collectivite_id}",
                "referentiel": f"eq.{referentiel}",
            },
        )
        return [
            ActionStatut(
                action_id=ActionId(row["action_id"]),
                avancement=ActionStatutAvancement.from_json_data(row["avancement"]),
                concerne=row["concerne"],
            )
            for row in rows
        ]
