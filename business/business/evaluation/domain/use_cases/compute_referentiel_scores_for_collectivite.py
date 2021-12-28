from typing import Dict, List

from business.evaluation.domain.models import events
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
)
from business.evaluation.domain.models.action_score import ActionScore
from business.core.domain.models.referentiel import Referentiel
from business.evaluation.domain.ports.action_status_repo import (
    AbstractActionStatutRepository,
)
from business.referentiel.domain.ports.referentiel_repo import (
    AbstractReferentielRepository,
)
from business.core.domain.ports.domain_message_bus import AbstractDomainMessageBus
from business.utils.action_id import ActionId
from business.utils.use_case import UseCase
from business.utils.action_points_tree import (
    ActionPointTree,
    ActionsPointsTreeError,
)


class ComputeReferentielscoresError(Exception):
    pass


class ComputeReferentielScoresForCollectivite(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
        statuses_repo: AbstractActionStatutRepository,
    ) -> None:
        self.bus = bus
        self.statuses_repo = statuses_repo
        self.referentiel_repo = referentiel_repo
        self.points_trees: Dict[Referentiel, ActionPointTree] = {}

    def execute(self, command: events.ActionStatutUpdatedForCollectivite):
        point_tree = self.points_trees.get(command.referentiel)
        if point_tree is None:
            try:
                point_tree = self.build_points_tree(command.referentiel)
                self.points_trees[command.referentiel] = point_tree
            except ActionsPointsTreeError:
                self.bus.publish_event(
                    events.ReferentielScoresForCollectiviteComputationFailed(
                        f"Referentiel tree could not be computed for referentiel {command.referentiel}"
                    )
                )  # TODO
                return
        statuses = self.statuses_repo.get_all_for_collectivite(
            command.collectivite_id, command.referentiel
        )

        status_by_action_id: Dict[str, ActionStatut] = {
            action_status.action_id: action_status
            for action_status in statuses
            if action_status.is_renseigne
        }

        actions_non_concernes_ids: List[str] = [
            action_status.action_id
            for action_status in statuses
            if not action_status.concerne
        ]

        scores: Dict[str, ActionScore] = {}

        point_tree.map_on_taches(
            lambda tache: self.update_scores_from_tache_given_statuses(
                point_tree,
                scores,
                tache,
                status_by_action_id,
                actions_non_concernes_ids,
            )
        )
        point_tree.map_from_sous_actions_to_root(
            lambda action_id: self.update_scores_for_action_given_children_scores(
                point_tree, scores, action_id
            )
        )
        self.bus.publish_event(
            events.ReferentielScoresForCollectiviteComputed(
                collectivite_id=command.collectivite_id,
                referentiel=command.referentiel,
                scores=list(scores.values()),
            )
        )

    def update_scores_from_tache_given_statuses(
        self,
        point_tree: ActionPointTree,
        scores: Dict[str, ActionScore],
        tache_id: ActionId,
        status_by_action_id: Dict[str, ActionStatut],
        actions_non_concernes_ids: List[str],
    ):
        tache_points = point_tree.get_action_point(tache_id)
        referentiel_points = tache_points
        # sibling_taches = sous_action.actions
        # for tache in sibling_taches:
        # TODO : find a softer way to tell that points cannot be None once they have been filled by referentiel constructor.
        assert tache_points is not None

        tache_potentiel = tache_points  # TODO : handle concerne/non-concerne here

        tache_status = status_by_action_id.get(tache_id)
        tache_concerne = tache_id not in actions_non_concernes_ids

        if not tache_concerne:
            scores[tache_id] = ActionScore(
                action_id=tache_id,
                points=0,
                potentiel=0,
                previsionnel=0,
                total_taches_count=1,
                completed_taches_count=1,
                referentiel_points=referentiel_points,
                concerne=tache_concerne,
            )
            return

        if tache_status and tache_status.is_renseigne:
            tache_points = (
                tache_potentiel if tache_concerne and tache_status.is_done else 0.0
            )
            tache_previsionnel = (
                tache_potentiel
                if tache_concerne
                and (tache_status.is_done or tache_status.will_be_done)
                else 0.0
            )
            completed_taches_count = 1
        else:
            tache_points = tache_previsionnel = None
            completed_taches_count = 0

        scores[tache_id] = ActionScore(
            action_id=tache_id,
            points=tache_points,
            potentiel=tache_potentiel,
            previsionnel=tache_previsionnel,
            completed_taches_count=completed_taches_count,
            total_taches_count=1,
            referentiel_points=referentiel_points,
            concerne=tache_concerne,
        )

    def update_scores_for_action_given_children_scores(
        self,
        point_tree: ActionPointTree,
        scores: Dict[str, ActionScore],
        action_id: ActionId,
    ):
        action_children = point_tree.get_action_children(action_id)
        action_referentiel_points = point_tree.get_action_point(action_id)

        action_children_with_scores = [
            child_id for child_id in action_children if child_id in scores
        ]

        points = (
            None
            if all(
                [
                    scores[child_id].points is None
                    for child_id in action_children_with_scores
                ]
            )
            else sum(
                [
                    scores[child_id].points or 0.0
                    for child_id in action_children_with_scores
                ]
            )
        )
        previsionnel = (
            None
            if all(
                [
                    scores[child_id].previsionnel is None
                    for child_id in action_children_with_scores
                ]
            )
            else sum(
                [
                    scores[child_id].previsionnel or 0.0
                    for child_id in action_children_with_scores
                ]
            )
        )
        potentiel = sum(
            [
                scores[child_id].potentiel or 0.0
                if child_id in scores
                else point_tree.get_action_point(child_id)
                for child_id in action_children
            ]
        )

        concerne = (
            any([scores[child_id].concerne for child_id in action_children_with_scores])
            if action_children_with_scores
            else True
        )  # concerne if any action children is concerne
        completed_taches_count = sum(
            [
                scores[child_id].completed_taches_count
                for child_id in action_children_with_scores
            ]
        )
        total_taches_count = sum(
            [
                scores[child_id].total_taches_count if child_id in scores else 1
                for child_id in action_children
            ]
        )

        scores[action_id] = ActionScore(
            action_id=action_id,
            points=points,
            potentiel=potentiel,
            previsionnel=previsionnel,
            completed_taches_count=completed_taches_count,
            total_taches_count=total_taches_count,
            referentiel_points=action_referentiel_points,
            concerne=concerne,
        )

    def build_points_tree(self, referentiel: Referentiel) -> ActionPointTree:
        ref_points = self.referentiel_repo.get_all_points_from_referentiel(
            referentiel=referentiel
        )
        ref_children = self.referentiel_repo.get_all_children_from_referentiel(
            referentiel=referentiel
        )
        return ActionPointTree(ref_points, ref_children)
