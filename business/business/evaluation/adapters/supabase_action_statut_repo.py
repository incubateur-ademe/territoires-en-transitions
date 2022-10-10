from typing import List

from business.utils.models.actions import ActionReferentiel
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
)
from business.evaluation.adapters import supabase_names
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
    ActionId,
    DetailedAvancement,
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
        return [self.action_statut_from_row(row) for row in rows]

    @staticmethod
    def action_statut_from_row(row: dict) -> ActionStatut:
        if row["avancement"] == "fait":
            detailed_avancement = DetailedAvancement(1, 0, 0)
        elif row["avancement"] == "programme":
            detailed_avancement = DetailedAvancement(0, 1, 0)
        elif row["avancement"] == "pas_fait":
            detailed_avancement = DetailedAvancement(0, 0, 1)
        elif row["avancement"] == "non_renseigne":
            detailed_avancement = None
        else:
            detailed_avancement = DetailedAvancement(*row["avancement_detaille"])

        return ActionStatut(
            action_id=ActionId(row["action_id"]),
            detailed_avancement=detailed_avancement,
            concerne=row["concerne"],
        )
