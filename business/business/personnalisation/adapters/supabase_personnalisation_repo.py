from dataclasses import asdict
from itertools import groupby
from typing import Dict, List
from business.evaluation.adapters import supabase_names
from business.evaluation.domain.models.events import (
    TriggerPersonnalisationForCollectivite,
)


from business.personnalisation.models import (
    ActionPersonnalisationConsequence,
    IdentiteCollectivite,
    Reponse,
)
from business.personnalisation.ports.personnalisation_repo import (
    AbstractPersonnalisationRepository,
)
from business.referentiel.domain.models.personnalisation import (
    ActionPersonnalisationRegles,
    Regle,
)
from business.utils.action_id import ActionId
from business.utils.supabase_repo import SupabaseRepository


class SupabasePersonnalisationRepository(
    SupabaseRepository,
    AbstractPersonnalisationRepository,
):
    def get_reponses_for_collectivite(self, collectivite_id: int) -> List[Reponse]:
        rows = self.client.db.get_by(
            supabase_names.views.reponse,
            {
                "collectivite_id": f"eq.{collectivite_id}",
            },
        )
        if not rows:
            return []

        return [
            Reponse(id=row["question_id"], value=row["reponse"])
            for row in rows[0]["reponses"]
        ]

    def get_identite_for_collectivite(
        self, collectivite_id: int
    ) -> IdentiteCollectivite:
        rows = self.client.db.get_by(
            supabase_names.views.identite,
            {
                "id": f"eq.{collectivite_id}",
            },
        )
        if not rows:
            return IdentiteCollectivite()
        return IdentiteCollectivite(
            type=set(rows[0]["type"]),
            localisation=set(rows[0]["localisation"]),
            population=set(rows[0]["population"]),
        )

    def save_action_personnalisation_consequences_for_collectivite(
        self,
        collectivite_id: int,
        action_personnalisation_consequences: Dict[
            ActionId, ActionPersonnalisationConsequence
        ],
    ) -> None:
        if not action_personnalisation_consequences:
            return

        action_personnalisations_json = {
            action_id: asdict(action_personnalisation)
            for action_id, action_personnalisation in action_personnalisation_consequences.items()
        }

        self.client.db.insert(
            supabase_names.tables.personnalisation_consequence,
            {
                "collectivite_id": collectivite_id,
                "consequences": action_personnalisations_json,
            },
            merge_duplicates=True,
        )

    def get_personnalisation_regles(
        self,
    ) -> List[ActionPersonnalisationRegles]:
        rows = self.client.db.get_all(
            supabase_names.tables.personnalisation_regle,
        )
        get_action_id = lambda row: row["action_id"]

        personnalisation_regles = [
            ActionPersonnalisationRegles(
                action_id=action_id,
                regles=[
                    Regle(
                        action_regle["formule"], action_regle["type"]
                    )  # type : ignore
                    for action_regle in list(action_regles)
                ],
            )
            for (action_id, action_regles) in groupby(
                sorted(rows, key=get_action_id), key=get_action_id
            )
        ]
        return personnalisation_regles

    def get_unprocessed_reponse_events(
        self,
    ) -> List[TriggerPersonnalisationForCollectivite]:
        rows = self.client.db.get_all(
            supabase_names.views.unprocessed_reponse_event,
        )
        return [
            TriggerPersonnalisationForCollectivite(row["collectivite_id"])
            for row in rows
        ]

    def get_action_personnalisation_consequences_for_collectivite(
        self,
        collectivite_id: int,
    ) -> Dict[ActionId, ActionPersonnalisationConsequence]:
        rows = self.client.db.get_by(
            supabase_names.tables.personnalisation_consequence,
            {
                "collectivite_id": f"eq.{collectivite_id}",
            },
        )
        if not rows:
            return {}
        return {
            action_id: ActionPersonnalisationConsequence(**serialized_consequence)
            for action_id, serialized_consequence in rows[0]["consequences"].items()
        }
