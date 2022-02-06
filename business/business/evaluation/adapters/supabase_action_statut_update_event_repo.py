from typing import List

from business.evaluation.domain.ports.action_statut_update_event_repo import (
    AbstractActionStatutUpdateEventRepository,
)

from business.core.domain.models.generated.unprocessed_action_statut_update_event_read import (
    UnprocessedActionStatutUpdateEventRead,
)
from business.utils.supabase_repo import SupabaseError, SupabaseRepository
from business.evaluation.adapters import supabase_table_names


class SupabaseActionStatutUpdateEventRepository(
    SupabaseRepository, AbstractActionStatutUpdateEventRepository
):
    def get_unprocessed_events(self) -> List[UnprocessedActionStatutUpdateEventRead]:
        result = self.table.select("*").execute()  # type: ignore
        if not result["status_code"] == 200:
            raise SupabaseError(str(result["data"]))
        rows = result["data"]
        return [
            UnprocessedActionStatutUpdateEventRead(
                collectivite_id=row["collectivite_id"],
                referentiel=row["referentiel"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    @property
    def table(self):
        return self.supabase_client.table(
            supabase_table_names.unprocessed_action_statut_event
        )
