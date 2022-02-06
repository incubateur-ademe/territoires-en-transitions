from typing import List

from business.core.domain.models.referentiel import ActionReferentiel
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
)
from business.evaluation.adapters import supabase_table_names
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
    ActionId,
    ActionStatutAvancement,
)
from business.utils.supabase_repo import SupabaseError, SupabaseRepository
from business.utils.timeit import timeit


class SupabaseActionStatutRepository(
    SupabaseRepository,
    AbstractActionStatutRepository,
):
    def get_all_for_collectivite(
        self, collectivite_id: int, referentiel: ActionReferentiel
    ) -> List[ActionStatut]:
        result = (
            self.supabase_client.table(supabase_table_names.business_action_statut)
            .select("*")  # type: ignore
            .eq("collectivite_id", str(collectivite_id))
            .eq("referentiel", referentiel)
            .execute()
        )
        if not result["status_code"] == 200:
            raise SupabaseError(str(result["data"]))
        rows = result["data"]
        return [
            ActionStatut(
                action_id=ActionId(row["action_id"]),
                avancement=ActionStatutAvancement.from_json_data(row["avancement"]),
                concerne=row["concerne"],
            )
            for row in rows
        ]
