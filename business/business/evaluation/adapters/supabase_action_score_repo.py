from datetime import datetime
from typing import List

from dataclasses import asdict


from business.evaluation.domain.models.action_score import ActionScore
from business.evaluation.domain.ports.action_score_repo import (
    AbstractActionScoreRepository,
)

from business.utils.supabase_repo import SupabaseRepository
from business.evaluation.adapters import supabase_names


class SupabaseActionScoreRepository(
    SupabaseRepository,
    AbstractActionScoreRepository,
):
    def add_entities_for_collectivite(
        self, collectivite_id: int, entities: List[ActionScore]
    ):
        if not entities:
            return

        referentiel = entities[0].referentiel
        client_scores_json = [asdict(score) for score in entities]
        self.client.db.insert(
            supabase_names.tables.client_scores,
            {
                "collectivite_id": collectivite_id,
                "referentiel": referentiel,
                "scores": client_scores_json,
                "score_created_at": self.get_now(),
            },
            merge_duplicates=True,
        )

    def get_now(self) -> str:
        return datetime.now().strftime("%m/%d/%Y %H:%M:%S")
