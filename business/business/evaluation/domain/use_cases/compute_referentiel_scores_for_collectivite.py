import math
import logging
from typing import Dict, List, Optional

from business.evaluation.domain.models import events
from business.evaluation.domain.models.action_statut import (
    ActionStatut,
)
from business.evaluation.domain.models.action_score import ActionScore
from business.core.domain.models.referentiel import ActionReferentiel
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

logger = logging.getLogger()


class ComputeReferentielscoresError(Exception):
    pass


class ComputeReferentielScoresForCollectivite(UseCase):
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        referentiel_repo: AbstractReferentielRepository,
        statuses_repo: AbstractActionStatutRepository,
        referentiel_action_level: Optional[Dict[ActionReferentiel, int]] = None,
    ) -> None:
        self.bus = bus
        self.statuses_repo = statuses_repo
        self.referentiel_repo = referentiel_repo
        self.points_trees: Dict[ActionReferentiel, ActionPointTree] = {}
        self.referentiel_action_level = referentiel_action_level or {"eci": 2, "cae": 3}

    def execute(self, command: events.ActionStatutUpdatedForCollectivite):
        point_tree = self.points_trees.get(command.referentiel)
        action_level = self.referentiel_action_level[command.referentiel]

        if point_tree is None:
            try:
                point_tree = self._build_points_tree(command.referentiel)
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

        print("\nFetched statuses from datalayer : ", statuses)

        status_by_action_id: Dict[str, ActionStatut] = {
            action_status.action_id: action_status
            for action_status in statuses
            if action_status.is_renseigne
        }

        scores: Dict[ActionId, ActionScore] = {}

        # 1. First, calculate all potentiels after 'non concernee' action's points redistribution
        actions_non_concernes_ids = self.compute_actions_non_concernes_ids(
            point_tree, statuses
        )
        potentiels = self.compute_potentiels(
            point_tree, actions_non_concernes_ids, action_level
        )

        # 2. Estimate tache points based on statuses
        point_tree.map_on_taches(
            lambda tache: self.update_scores_from_tache_given_statuses(
                point_tree,
                scores,
                potentiels,
                tache,
                status_by_action_id,
                actions_non_concernes_ids,
                command.referentiel,
            )
        )
        # 3. Infer all action points based on their children's
        point_tree.map_from_sous_actions_to_root(
            lambda action_id: self.update_scores_for_action_given_children_scores(
                point_tree, scores, potentiels, action_id, command.referentiel
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
        scores: Dict[ActionId, ActionScore],
        potentiels: Dict[ActionId, float],
        tache_id: ActionId,
        status_by_action_id: Dict[str, ActionStatut],
        actions_non_concernes_ids: List[ActionId],
        referentiel: ActionReferentiel,
    ):

        tache_points = point_tree.get_action_point(tache_id)

        # TODO : find a softer way to tell that points cannot be None once they have been filled by referentiel constructor.
        assert tache_points is not None

        tache_point_potentiel = potentiels[tache_id]
        tache_status = status_by_action_id.get(tache_id)
        tache_concerne = tache_id not in actions_non_concernes_ids

        if not tache_concerne:
            scores[tache_id] = ActionScore(
                action_id=tache_id,
                point_fait=0,
                point_pas_fait=0,
                point_programme=0,
                point_non_renseigne=tache_point_potentiel,
                point_potentiel=tache_point_potentiel,
                total_taches_count=1,
                completed_taches_count=1,
                point_referentiel=tache_points,
                concerne=tache_concerne,
                referentiel=referentiel,
            )
            return

        if tache_status and tache_status.is_renseigne:
            point_fait = (
                tache_point_potentiel
                if tache_concerne and tache_status.is_fait
                else 0.0
            )
            point_programme = (
                tache_point_potentiel
                if tache_concerne and tache_status.is_programme
                else 0.0
            )
            point_pas_fait = (
                tache_point_potentiel
                if tache_concerne and tache_status.is_pas_fait
                else 0.0
            )
            point_non_renseigne = 0.0

            print(
                f"\n For tache {tache_id}, point_fait is {point_fait}, point_fait is {point_programme}, point_pas_fait is {point_pas_fait}, avancement is {tache_status.avancement}, concerne is {tache_concerne}."
            )
            completed_taches_count = 1
        else:
            point_pas_fait = point_programme = point_fait = 0.0
            point_non_renseigne = tache_point_potentiel
            completed_taches_count = 0

        scores[tache_id] = ActionScore(
            action_id=tache_id,
            point_pas_fait=point_pas_fait,
            point_programme=point_programme,
            point_non_renseigne=point_non_renseigne,
            point_fait=point_fait,
            point_potentiel=tache_point_potentiel,
            point_referentiel=tache_points,
            completed_taches_count=completed_taches_count,
            total_taches_count=1,
            concerne=tache_concerne,
            referentiel=referentiel,
        )

    def update_scores_for_action_given_children_scores(
        self,
        point_tree: ActionPointTree,
        scores: Dict[ActionId, ActionScore],
        potentiels: Dict[ActionId, float],
        action_id: ActionId,
        referentiel: ActionReferentiel,
    ):
        action_children = point_tree.get_action_children(action_id)
        action_point_referentiel = point_tree.get_action_point(action_id)

        action_children_with_scores = [
            child_id for child_id in action_children if child_id in scores
        ]

        point_pas_fait = sum(
            [
                scores[child_id].point_pas_fait
                for child_id in action_children_with_scores
            ]
        )

        point_fait = sum(
            [scores[child_id].point_fait for child_id in action_children_with_scores]
        )

        point_programme = sum(
            [
                scores[child_id].point_programme
                for child_id in action_children_with_scores
            ]
        )
        point_non_renseigne = sum(
            [
                scores[child_id].point_non_renseigne
                for child_id in action_children_with_scores
            ]
        )
        point_potentiel = potentiels[action_id]
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
            point_fait=point_fait,
            point_pas_fait=point_pas_fait,
            point_programme=point_programme,
            point_non_renseigne=point_non_renseigne,
            point_potentiel=point_potentiel,
            completed_taches_count=completed_taches_count,
            total_taches_count=total_taches_count,
            point_referentiel=action_point_referentiel,
            concerne=concerne,
            referentiel=referentiel,
        )

    def _build_points_tree(self, referentiel: ActionReferentiel) -> ActionPointTree:
        ref_points = self.referentiel_repo.get_all_points_from_referentiel(
            referentiel=referentiel
        )
        ref_children = self.referentiel_repo.get_all_children_from_referentiel(
            referentiel=referentiel
        )
        return ActionPointTree(ref_points, ref_children)

    def _get_non_concerne_action_ids(
        self,
        action_id: ActionId,
        actions_non_concernes_ids: List[ActionId],
        point_tree: ActionPointTree,
    ):
        if action_id in actions_non_concernes_ids:
            return
        children = point_tree.get_action_children(action_id)
        if children and all([child in actions_non_concernes_ids for child in children]):
            actions_non_concernes_ids.append(action_id)

    def _get_action_potentiel_after_redistribution_for_level_greater_than_action_level(
        self,
        action_id: ActionId,
        original_action_potentiel: float,
        actions_non_concernes_ids: List[ActionId],
        point_tree: ActionPointTree,
    ):
        # If some siblings are non concernes, redistribute their points
        action_siblings = point_tree.get_action_siblings(action_id)
        action_sibling_is_non_concerne = [
            action_id in actions_non_concernes_ids for action_id in action_siblings
        ]

        if any(action_sibling_is_non_concerne) and not all(
            action_sibling_is_non_concerne
        ):  # Some (but not all) actions are 'non-concernes'
            siblings_non_concernes = set(action_siblings).intersection(
                set(actions_non_concernes_ids)
            )
            siblings_concernes = set(action_siblings).difference(
                set(siblings_non_concernes)
            )
            points_non_concerne_to_redistribute = sum(
                [
                    point_tree.get_action_point(action_id)
                    for action_id in siblings_non_concernes
                ]
            )
            actions_to_redistribute_amongst = [
                action_id
                for action_id in siblings_concernes
                if point_tree.get_action_point(action_id) != 0
            ]
            if action_id in actions_to_redistribute_amongst:
                return (
                    original_action_potentiel
                    + points_non_concerne_to_redistribute
                    / (len(actions_to_redistribute_amongst))
                )
        return original_action_potentiel

    def compute_actions_non_concernes_ids(
        self, point_tree: ActionPointTree, statuses: List[ActionStatut]
    ):
        taches_non_concernes_ids = [
            action_status.action_id
            for action_status in statuses
            if not action_status.concerne
        ]

        # 1. First, calculate all potentiels after 'non concernee' action's points redistribution
        actions_non_concernes_ids = taches_non_concernes_ids
        point_tree.map_from_taches_to_root(
            lambda action_id: self._get_non_concerne_action_ids(
                action_id, actions_non_concernes_ids, point_tree
            )
        )
        return actions_non_concernes_ids

    def compute_potentiels(
        self,
        point_tree: ActionPointTree,
        actions_non_concernes_ids: List[ActionId],
        action_level: int,
    ) -> Dict[ActionId, float]:
        potentiels = {}

        def _add_action_potentiel_after_redistribution(
            action_id: ActionId,
        ):
            this_level = point_tree.get_action_level(action_id)
            children = point_tree.get_action_children(action_id)

            if not children:  # tache
                original_action_potentiel = (
                    0
                    if action_id in actions_non_concernes_ids
                    else point_tree.get_action_point(action_id)
                )
            else:
                original_action_potentiel = sum(
                    [
                        potentiels[child_id]
                        for child_id in point_tree.get_action_children(action_id)
                    ]
                )

            if this_level > action_level:
                potentiel = self._get_action_potentiel_after_redistribution_for_level_greater_than_action_level(
                    action_id,
                    original_action_potentiel,
                    actions_non_concernes_ids,
                    point_tree,
                )
                potentiels[action_id] = potentiel
            else:
                potentiels[action_id] = original_action_potentiel

        point_tree.map_from_taches_to_root(
            lambda action_id: _add_action_potentiel_after_redistribution(
                action_id,
            )
        )

        def _resize_children_potentiels(action_id: ActionId):
            action_potentiel = potentiels[action_id]
            action_referentiel_points = point_tree.get_action_point(action_id)
            if action_potentiel != action_referentiel_points:
                children = point_tree.get_action_children(action_id)
                if not children:
                    return
                children_potentiel_sum_before_resize = sum(
                    [potentiels[child_id] for child_id in children]
                )
                if not math.isclose(
                    action_potentiel,
                    children_potentiel_sum_before_resize,
                    rel_tol=0.01,
                ):

                    for child_id in children:
                        new_child_potentiel = (
                            potentiels[child_id]
                            / action_referentiel_points
                            * action_potentiel
                        )
                        potentiels[child_id] = new_child_potentiel
                    children_potentiel_sum = sum(
                        [potentiels[child_id] for child_id in children]
                    )
                    if not math.isclose(
                        action_potentiel,
                        children_potentiel_sum,
                        rel_tol=0.01,  # TODO : should not happen. fix me.
                    ):
                        message = f"Children potentiels should sum up to parent potentiel, got action {action_id} with potentiel {action_potentiel} and its children's potentiels sum to {children_potentiel_sum}"
                        logger.warn(message)
                        raise Exception(message)

        point_tree.map_from_action_to_taches(
            lambda action_id: _resize_children_potentiels(
                action_id,
            ),
            action_level,
        )
        return potentiels
