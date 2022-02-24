from typing import List

from business.evaluation.domain.ports.action_statut_update_event_repo import (
    AbstractActionStatutUpdateEventRepository,
)

from business.core.domain.models.generated.unprocessed_action_statut_update_event_read import (
    UnprocessedActionStatutUpdateEventRead,
)
from business.utils.supabase_repo import SupabaseRepository
from business.evaluation.adapters import supabase_names


class SupabaseActionStatutUpdateEventRepository(
    SupabaseRepository, AbstractActionStatutUpdateEventRepository
):
    def get_unprocessed_events(self) -> List[UnprocessedActionStatutUpdateEventRead]:
        rows = self.client.db.get_all(
            supabase_names.views.unprocessed_action_statut_event
        )
        return [
            UnprocessedActionStatutUpdateEventRead(
                collectivite_id=row["collectivite_id"],
                referentiel=row["referentiel"],
                created_at=row["created_at"],
            )
            for row in rows
        ]
