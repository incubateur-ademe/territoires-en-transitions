from dataclasses import dataclass
from typing import Dict, List, Optional
from business.domain.models import commands, events

from business.domain.models.action_status import (
    ActionStatus,
)
from business.domain.models.action_score import ActionScore
from business.domain.models.litterals import ReferentielId
from business.domain.ports.action_status_repo import AbstractActionStatusRepository
from business.domain.ports.action_points_repo import AbstractActionPointsRepository
from business.domain.ports.action_children_repo import AbstractActionChildrenRepository
from business.domain.ports.domain_message_bus import AbstractDomainMessageBus
from business.utils.action_points_tree import ActionPointsNode, ActionsPointsTree, ActionsPointsTreeError


class ComputeReferentielscoresError(Exception):
    pass



class ComputeReferentielScoresForEpci:
    def __init__(
        self,
        bus: AbstractDomainMessageBus,
        points_repo: AbstractActionPointsRepository,
        children_repo: AbstractActionChildrenRepository,
        statuses_repo: AbstractActionStatusRepository,
    ) -> None:
        self.bus = bus
        self.statuses_repo = statuses_repo
        self.points_repo = points_repo
        self.children_repo = children_repo
        self.points_trees : Dict[ReferentielId, ActionsPointsTree] = {}


    def execute(self, command: commands.ComputeReferentielScoresForEpci):
        
        point_tree = self.points_trees.get(command.referentiel_id)
        if point_tree is None: 
            try: 
                point_tree = self.build_points_tree(command.referentiel_id)
                self.points_trees[command.referentiel_id] = point_tree
            except ActionsPointsTreeError:
                # bus.publish() # TODO 
                return 
        statuses = self.statuses_repo.get_all_for_epci(command.epci_id)

        status_by_action_id: Dict[str, ActionStatus] = {
            action_status.action_id: action_status
            for action_status in statuses
            if action_status.is_renseigne
        }

        actions_non_concernees_ids: List[str] = [
            action_status.action_id
            for action_status in statuses
            if not action_status.concernee
        ]

        scores: Dict[str, ActionScore] = {}

        point_tree.map_on_taches(
            lambda tache: self.update_scores_from_tache_given_statuses(
                scores, tache, status_by_action_id, actions_non_concernees_ids
            )
        )

        point_tree.map_from_sous_actions_to_root(
            lambda action: self.update_scores_for_action_given_children_scores(
                scores, action
            )
        )
        self.bus.publish_event(events.ReferentielScoresForEpciComputed(epci_id=command.epci_id, referentiel_id=command.referentiel_id, scores=list(scores.values())))


    def update_scores_from_tache_given_statuses(
        self,
        scores: Dict[str, ActionScore],
        tache_points_node: ActionPointsNode,
        status_by_action_id: Dict[str, ActionStatus],
        actions_non_concernees_ids: List[str],
    ):
        # sibling_taches = sous_action.actions
        # for tache in sibling_taches:
        # TODO : find a softer way to tell that points cannot be None once they have been filled by referentiel constructor.
        assert tache_points_node.value is not None

        tache_potentiel = (
            tache_points_node.value
        )  # TODO : handle concerne/non-concerne here

        tache_status = status_by_action_id.get(tache_points_node.action_id)
        tache_concernee = tache_points_node.action_id not in actions_non_concernees_ids

        if not tache_concernee:
            scores[tache_points_node.action_id] = ActionScore(
                action_id=tache_points_node.action_id,
                points=0,
                potentiel=0,
                previsionnel=0,
                completude_ratio=(1, 1),
                referentiel_points=tache_points_node.value,
                concernee=tache_concernee,
            )
            return

        if tache_status:
            tache_points = (
                tache_potentiel if tache_concernee and tache_status.is_done else 0.0
            )
            tache_previsionnel = (
                tache_potentiel
                if tache_concernee
                and (tache_status.is_done or tache_status.will_be_done)
                else 0.0
            )
            scores[tache_points_node.action_id] = ActionScore(
                action_id=tache_points_node.action_id,
                points=tache_points,
                potentiel=tache_potentiel,
                previsionnel=tache_previsionnel,
                completude_ratio=(1, 1),
                referentiel_points=tache_points_node.value,
                concernee=tache_concernee,
            )

    def update_scores_for_action_given_children_scores(
        self, scores: Dict[str, ActionScore], action: ActionPointsNode
    ):
        action_children = action.children
        action_referentiel_points = action.value
        action_children_with_scores = [
            child for child in action_children if child.action_id in scores
        ]
        points = sum(
            [
                scores[child.action_id].points
                for child in action_children_with_scores
            ]
        )
        potentiel = sum(
            [
                scores[child.action_id].potentiel
                if child.action_id in scores
                else child.value
                for child in action_children
            ]
        )
        previsionnel = sum(
            [
                scores[child.action_id].previsionnel
                for child in action_children_with_scores
            ]
        )
        concernee = (
            any(
                [
                    scores[child.action_id].concernee
                    for child in action_children_with_scores
                ]
            )
            if action_children_with_scores
            else True
        )  # concernee if any action children is concernee
        completude_numerator = sum(
            [
                scores[child.action_id].completude_ratio[0]
                for child in action_children_with_scores
            ]
        )
        completude_denominator = sum(
            [
                scores[child.action_id].completude_ratio[1]
                if child.action_id in scores
                else 1
                for child in action_children
            ]
        )

        scores[action.action_id] = ActionScore(
            action_id=action.action_id,
            points=points,
            potentiel=potentiel,
            previsionnel=previsionnel,
            completude_ratio=(
                completude_numerator,
                completude_denominator,
            ),
            referentiel_points=action_referentiel_points,
            concernee=concernee,
        )

    def build_points_tree(self, referentiel_id: ReferentielId) -> ActionsPointsTree:
        ref_points = self.points_repo.get_all_from_referentiel(referentiel_id=referentiel_id)
        ref_children = self.children_repo.get_all_from_referentiel(referentiel_id=referentiel_id)
        return ActionsPointsTree(ref_points, ref_children)
